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
        // USE 'let', NOT 'const', because we might reassign it below
        let userId = req.session.userId; 

        // If session userId is missing, try getting it from Passport's req.user
        if (!userId && req.user) {
            // Handle both object (standard) and primitive (your specific deserializer)
            userId = (typeof req.user === 'object') ? req.user.id : req.user;
        }

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        try {
            const userData = await getFullUserData(userId);
            
            // Debug logging (optional, remove in production)
            // console.log(`[ROLE-CHECKER] User: ${userId}, Permissions:`, userData ? [...userData.permissions] : 'None');
            
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