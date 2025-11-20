/**
 * @file routes/api/admin/user-role-router.js
 * @description API routes for administrative assignment of Roles to Users.
 * Access is restricted via the PROVISION_USERS permission.
 */

const express = require('express');
const router = express.Router();
const { 
    assignRolesToUser,          
    getRolePrivilegeLevel       
} = require('../../../models/db');

// 1. Import the generic permission checker
const { requirePermission } = require('../../../middleware/role-checker'); 
const { UNPRIVILEGED_THRESHOLD } = require('../../../utils/permission-resolver'); 

/**
 * PUT /api/admin/users/:userId/roles
 * Professor assigns a list of role IDs to a user.
 * Requires Permission: 'ASSIGN_ROLES'
 * Request Body: { roleIds: Array<number> }
 */
router.put('/users/:userId/roles', requirePermission('ASSIGN_ROLES'), async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { roleIds } = req.body; 

    if (isNaN(userId) || !Array.isArray(roleIds)) {
        return res.status(400).json({ error: 'Invalid userId or missing/invalid roleIds array.' });
    }

    try {
        // --- 1. PROACTIVE SECURITY CHECK: Enforce single privileged role rule ---
        
        // Check the privilege level of every role ID in the requested list
        const privilegeLevelChecks = await Promise.all(
            roleIds.map(roleId => getRolePrivilegeLevel(roleId))
        );
        
        const newPrivilegedRoleCount = privilegeLevelChecks.filter(
            // Re-use the constant from permission-resolver for consistency
            level => level > UNPRIVILEGED_THRESHOLD
        ).length;

        if (newPrivilegedRoleCount > 1) {
            // **SECURITY BLOCK**
            return res.status(403).json({ 
                error: "Security Violation: Cannot assign a user more than one privileged role (level > 1)." 
            });
        }

        const allPrivilegeLevels = privilegeLevelChecks.filter(level => level !== null);

        if (allPrivilegeLevels.length > 1 && new Set(allPrivilegeLevels).size > 1) {
        // SECURITY BLOCK: Different privilege levels detected (e.g., 1 and 50)
        // The resolver will handle it (by using the lowest), but the assignment is logically flawed.
            return res.status(400).json({ 
                error: "Assignment Violation: Roles must all be assigned at the same privilege level." 
            });
        }
        
        // --- 2. EXECUTION ---
        await assignRolesToUser(userId, roleIds);
        
        return res.status(200).json({ 
            success: true, 
            message: `Roles updated successfully for User ID ${userId}.` 
        });

    } catch (error) {
        console.error('API Error updating user roles:', error);
        return res.status(500).json({ error: 'Failed to update user roles.' });
    }
});

module.exports = router;