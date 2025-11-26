/**
 * @file routes/api/admin/groups-roles-router.js
 * @description API routes for administrative creation and management of Groups and Roles/Permissions.
 */

const express = require('express');
const router = express.Router();
const { createGroup, createRole, createPermission, setRolePermissions } = require('../../../models/db');
const { requirePermission } = require('../../../middleware/role-checker');

router.post('/groups', requirePermission('CREATE_GROUPS'), async (req, res) => {
    /**
     * @swagger
     * #swagger.tags = ['Admin - Groups & Roles']
     * #swagger.summary = 'Create a group'
     * #swagger.description = 'Requires CREATE_GROUPS permission.'
     * #swagger.parameters['body'] = {
     *    in: 'body',
     *    schema: { name: "Team A", logoUrl: "", slackLink: "", repoLink: "" }
     * }
     * #swagger.responses[201] = { description: "Group created" }
     */
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
 * @swagger
 * #swagger.tags = ['Admin - Groups & Roles']
 * #swagger.summary = 'Create a role'
 * #swagger.description = 'Requires CREATE_ROLES permission.'
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
 * @swagger
 * #swagger.tags = ['Admin - Groups & Roles']
 * #swagger.summary = 'Create a permission'
 * #swagger.description = 'Requires CREATE_PERMISSIONS permission.'
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
 * @swagger
 * #swagger.tags = ['Admin - Groups & Roles']
 * #swagger.summary = 'Set permissions for a role'
 * #swagger.description = 'Requires MANAGE_PERMISSIONS permission.'
 * #swagger.parameters['roleId'] = { description: 'Role ID' }
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

module.exports = router;