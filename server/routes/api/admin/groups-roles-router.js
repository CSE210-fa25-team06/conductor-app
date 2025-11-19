/**
 * @file routes/api/admin/groups-roles-router.js
 * @description API routes for administrative creation and management of Groups and Roles/Permissions.
 */

const express = require('express');
const router = express.Router();
// IMPORTANT: createRole must be updated to accept privilege_level in db.js
const { createGroup, createRole, createPermission, setRolePermissions } = require('../../../models/db');
const { requirePermission } = require('../../../middleware/role-checker');

router.use(requirePermission('PROVISION_USERS'))

/**
 * POST /api/admin/groups
 * Creates a new Group.
 * Request Body: { name: string, ...optional fields }
 */
router.post('/groups', async (req, res) => {
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
        // Handle unique constraint error (e.g., group name already exists)
        if (error.code === '23505') { 
            return res.status(409).json({ error: `Group name '${name}' already exists.` });
        }
        console.error('API Error creating group:', error);
        return res.status(500).json({ error: 'Failed to create group due to a server error.' });
    }
});

/**
 * POST /api/admin/roles
 * Creates a new Role. Now requires 'privilege_level'.
 * Request Body: { name: string, privilege_level: number }
 */
router.post('/roles', async (req, res) => {
    const { name, privilege_level } = req.body;

    if (!name || typeof privilege_level !== 'number') {
        return res.status(400).json({ error: 'Role name and numeric privilege_level are required.' });
    }

    try {
        // NOTE: createRole in db.js must be updated to handle the privilege_level
        const newRoleId = await createRole(name, privilege_level); 
        
        return res.status(201).json({ 
            success: true, 
            id: newRoleId, 
            message: `Role '${name}' created successfully with level ${privilege_level}.` 
        });

    } catch (error) {
        // ... (error handling) ...
        return res.status(500).json({ error: 'Failed to create role due to a server error.' });
    }
});

/**
 * POST /api/admin/permissions
 * Professor creates a new permission (optional for front-end configuration).
 */
router.post('/permissions', async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Permission name and description are required.' });
    }

    try {
        const newPermissionId = await createPermission(name, description);
        
        return res.status(201).json({ 
            success: true, 
            id: newPermissionId, 
            message: `Permission '${name}' created successfully.` 
        });
        
    } catch (error) {
        if (error.code === '23505') { 
            return res.status(409).json({ error: `Permission name '${name}' already exists.` });
        }
        console.error('API Error creating permission:', error);
        return res.status(500).json({ error: 'Failed to create permission.' });
    }
});


/**
 * PUT /api/admin/roles/:roleId/permissions
 * Professor configures the full list of permissions for a single role.
 */
router.put('/roles/:roleId/permissions', async (req, res) => {
    const roleId = parseInt(req.params.roleId, 10);
    const { permissionNames } = req.body; 

    if (isNaN(roleId) || !Array.isArray(permissionNames)) {
        return res.status(400).json({ error: 'Invalid roleId or missing/invalid permissionNames array.' });
    }
    
    // NOTE: For now, we assume the Professor knows which permissions to assign.
    // We rely on the setRolePermissions transaction to fail if any permissionName is invalid.

    try {
        await setRolePermissions(roleId, permissionNames);
        
        return res.status(200).json({ 
            success: true, 
            message: `Permissions updated successfully for Role ID ${roleId}.` 
        });

    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        console.error('API Error setting role permissions:', error);
        return res.status(500).json({ error: 'Failed to set role permissions due to a server error.' });
    }
});

module.exports = router;