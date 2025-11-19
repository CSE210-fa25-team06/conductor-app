/**
 * @file middleware/role-checker.js
 * @description Authorization middleware that ensures the authenticated user 
 * has the required permission or role to access a route.
 */

const { getFullUserData } = require('../models/db');

/**
 * NEW: Generic middleware to check if the user has a specific permission.
 * This is the preferred method for fine-grained authorization.
 * @param {string} permissionName - The specific permission string required (e.g., 'PROVISION_USERS').
 */
function requirePermission(permissionName) {
    return async (req, res, next) => {
        // FIX: Explicitly extract the ID from req.user if it exists,
        // otherwise, use req.session.userId. This ensures 'userId' is a primitive ID or null.
        const userId = req.session.userId || (req.user && req.user.id); 

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        try {
            // Fetch the user's data, which includes the resolved permissions (Set)
            const userData = await getFullUserData(userId);
            console.log(userData);
            
            // Check if the user exists AND if their permissions Set contains the required permission
            if (!userData || !userData.permissions.includes(permissionName)) {
                return res.status(403).json({ 
                    error: `Access denied. Requires permission: ${permissionName}` 
                });
            } 

            return next();

        } catch (error) {
            console.error('Permission Checker Middleware Error:', error);
            return res.status(500).json({ error: 'Internal server error during authorization check.' });
        }
    };
}

module.exports = {
    requirePermission
};