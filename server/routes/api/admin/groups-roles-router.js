/**
 * @file routes/api/admin/groups-roles-router.js
 * @description API routes for administrative creation and management of Groups and Roles/Permissions.
 */

const express = require('express');
const router = express.Router();
const { createGroup, createRole, createPermission, setRolePermissions, getAllGroups } = require('../../../models/db');
const { requirePermission } = require('../../../middleware/role-checker');

/**
 * POST /api/admin/groups
 * Creates a new Group.
 * Requires Permission: 'CREATE_GROUPS'
 * Request Body: { name: string, ...optional fields }
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
        if (error.code === 'GROUP_EXISTS') {
            return res.status(409).json({ error: `Group '${name}' already exists.` });
        }
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
 * Creates a new Role.
 * Requires Permission: 'CREATE_ROLES'
 * Request Body: { name: string, privilege_level: number }
 */
router.post('/roles', requirePermission('CREATE_ROLES'), async (req, res) => {
    const { name, privilege_level } = req.body;

    if (!name || typeof privilege_level !== 'number') {
        return res.status(400).json({ error: 'Role name and numeric privilege_level are required.' });
    }

    try {
        const newRoleId = await createRole(name, privilege_level); 
        
        return res.status(201).json({ 
            success: true, 
            id: newRoleId, 
            message: `Role '${name}' created successfully with level ${privilege_level}.` 
        });

    } catch (error) {
        console.error('API Error creating role:', error);
        return res.status(500).json({ error: 'Failed to create role due to a server error.' });
    }
});

/**
 * POST /api/admin/permissions
 * Requires Permission: 'CREATE_PERMISSIONS'
 * Professor creates a new permission (optional for front-end configuration).
 */
router.post('/permissions', requirePermission('CREATE_PERMISSIONS'), async (req, res) => {
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
 * Requires Permission: 'MANAGE_PERMISSIONS'
 * Professor configures the full list of permissions for a single role.
 */
router.put('/roles/:roleId/permissions', requirePermission('MANAGE_PERMISSIONS'), async (req, res) => {
    const roleId = parseInt(req.params.roleId, 10);
    const { permissionNames } = req.body; 

    if (isNaN(roleId) || !Array.isArray(permissionNames)) {
        return res.status(400).json({ error: 'Invalid roleId or missing/invalid permissionNames array.' });
    }
    
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

/**
 * GET /api/admin/groups
 * Returns all groups for dropdown population
 * Requires Permission: 'CREATE_GROUPS' or 'ASSIGN_GROUPS'
 */
router.get('/groups', requirePermission('ASSIGN_GROUPS'), async (req, res) => {
    try {
        const groups = await getAllGroups();
        return res.status(200).json({ success: true, groups });
    } catch (error) {
        console.error('API Error fetching groups:', error);
        return res.status(500).json({ error: 'Failed to fetch groups.' });
    }
});

module.exports = router;