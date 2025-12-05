/**
 * @file routes/api/admin/groups-roles-router.js
 * @description API routes for administrative creation and management of Groups and Roles/Permissions.
 */

const express = require('express');
const router = express.Router();
const { 
    createGroup, 
    createRole,
    getAllPermissions,
    getPermissionsForRole,
    updateRoleConfiguration,
    getAllGroups
} = require('../../../models/db');
const { requirePermission } = require('../../../middleware/role-checker');

// NEW: Import the threshold constant
const { UNPRIVILEGED_THRESHOLD } = require('../../../utils/permission-resolver');

/**
 * POST /api/admin/groups
 * Creates a new Group.
 * Requires Permission: 'CREATE_GROUPS'
 */
router.post('/groups', requirePermission('CREATE_GROUPS'), async (req, res) => {
    const { name, logoUrl, slackLink, repoLink } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Group name is required.' });
    }

    try {
        const newGroupId = await createGroup(name, logoUrl, slackLink, repoLink);
        return res.status(201).json({ 
            success: true, 
            id: newGroupId, 
            message: `Group '${name}' created successfully.` 
        });
    } catch (error) {
        if (error.code === '23505') { 
            return res.status(409).json({ error: `Group name '${name}' already exists.` });
        }
        console.error('API Error creating group:', error);
        return res.status(500).json({ error: 'Failed to create group due to a server error.' });
    }
});

/**
 * POST /api/admin/roles
 * Creates a new Role.
 * Requires Permission: 'CREATE_ROLES'
 */
router.post('/roles', requirePermission('CREATE_ROLES'), async (req, res) => {
    // Extract description from body
    const { name, privilege_level, description } = req.body;

    if (!name || typeof privilege_level !== 'number') {
        return res.status(400).json({ error: 'Role name and numeric privilege_level are required.' });
    }

    try {
        // Pass description to the DB function
        const newRoleId = await createRole(name, privilege_level, description); 
        
        return res.status(201).json({ 
            success: true, 
            id: newRoleId, 
            message: `Role '${name}' created successfully.` 
        });

    } catch (error) {
        console.error('API Error creating role:', error);
        return res.status(500).json({ error: 'Failed to create role due to a server error.' });
    }
});

/**
 * GET /api/admin/permissions
 * Returns a master list of all permissions.
 * Requires Permission: 'MANAGE_PERMISSIONS'
 */
router.get('/permissions', requirePermission('MANAGE_PERMISSIONS'), async (req, res) => {
    try {
        const permissions = await getAllPermissions();
        res.status(200).json({ success: true, permissions });
    } catch (error) {
        console.error('API Error fetching permissions:', error);
        res.status(500).json({ error: 'Failed to fetch permissions.' });
    }
});

/**
 * GET /api/admin/groups
 * Returns a list of all groups.
 */
router.get('/groups', async (req, res) => {
    try {
        const groups = await getAllGroups();
        res.status(200).json({ success: true, groups });
    } catch (error) {
        console.error('API Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups.' });
    }
});

/**
 * GET /api/admin/roles/:roleId/permissions
 * Returns the list of permission names assigned to a specific role.
 * Requires Permission: 'MANAGE_PERMISSIONS'
 */
router.get('/roles/:roleId/permissions', requirePermission('MANAGE_PERMISSIONS'), async (req, res) => {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId)) return res.status(400).json({ error: 'Invalid roleId' });

    try {
        const permissionNames = await getPermissionsForRole(roleId);
        res.status(200).json({ success: true, permissionNames });
    } catch (error) {
        console.error('API Error fetching role permissions:', error);
        res.status(500).json({ error: 'Failed to fetch role permissions.' });
    }
});

/**
 * PUT /api/admin/roles/:roleId/permissions
 * Updates permissions AND privilege_level for a role.
 */
/**
 * PUT /api/admin/roles/:roleId/permissions
 * Updates permissions AND privilege_level for a role.
 */
router.put('/roles/:roleId/permissions', requirePermission('MANAGE_PERMISSIONS'), async (req, res) => {
    const roleId = parseInt(req.params.roleId, 10);
    const { permissionNames, privilegeLevel } = req.body; 

    if (isNaN(roleId) || !Array.isArray(permissionNames)) {
        return res.status(400).json({ error: 'Invalid data provided.' });
    }
    
    // Validate privilegeLevel
    let newLevel = null;
    if (privilegeLevel !== undefined) {
        newLevel = parseInt(privilegeLevel, 10);
        if (isNaN(newLevel) || newLevel < 0 || newLevel > 100) {
            return res.status(400).json({ error: 'Privilege level must be between 0 and 100.' });
        }
    }

    try {
        // ONE LINE to handle everything!
        await updateRoleConfiguration(roleId, permissionNames, newLevel);
        
        return res.status(200).json({ 
            success: true, 
            message: `Role configuration updated successfully.` 
        });

    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        console.error('API Error updating role:', error);
        return res.status(500).json({ error: 'Failed to update role configuration.' });
    }
});

/**
 * PUT /api/admin/defaults
 * Sets the system-wide default role and group.
 * SECURITY: Prevents setting a privileged role as default using UNPRIVILEGED_THRESHOLD.
 */
router.put('/defaults', requirePermission('CREATE_ROLES'), async (req, res) => {
    const { default_role_id } = req.body;
    
    if (!default_role_id || isNaN(parseInt(default_role_id))) {
        return res.status(400).json({ error: 'A valid default Role ID is required.' });
    }

    const client = await require('../../../models/db').pool.connect();

    try {
        const levelQuery = 'SELECT privilege_level, name FROM roles WHERE id = $1';
        const levelRes = await client.query(levelQuery, [default_role_id]);
        
        if (levelRes.rows.length === 0) {
            return res.status(404).json({ error: 'Role not found.' });
        }

        const role = levelRes.rows[0];
        
        if (role.privilege_level > UNPRIVILEGED_THRESHOLD) {
            return res.status(403).json({ 
                error: `Security Violation: Role '${role.name}' (Level ${role.privilege_level}) is too privileged to be a default (Max: ${UNPRIVILEGED_THRESHOLD}).` 
            });
        }

        await client.query('BEGIN');
        await client.query('UPDATE roles SET is_default = FALSE');
        await client.query('UPDATE roles SET is_default = TRUE WHERE id = $1', [default_role_id]);
        await client.query('COMMIT');

        return res.status(200).json({ success: true, message: 'System defaults updated.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('API Error setting defaults:', error);
        return res.status(500).json({ error: 'Failed to set system defaults.' });
    } finally {
        client.release();
    }
});

module.exports = router;