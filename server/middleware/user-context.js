const { getFullUserData } = require("../models/db");

/**
 * Middleware: loadUserContext
 * 1. Finds the User ID (checking both Session and Passport).
 * 2. Fetches full profile (roles, permissions, group).
 * 3. Attaches it to req.currentUser.
 * * Unlike 'requirePermission', this DOES NOT block access. 
 * It just prepares the data.
 */
async function loadUserContext(req, res, next) {
    try {
        // 1. Robust ID Lookup (The logic you had to repeat 3 times)
        let userId = req.session ? req.session.userId : null;
        if (!userId && req.user) {
            userId = (typeof req.user === 'object') ? req.user.id : req.user;
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // 2. Fetch Data
        const user = await getFullUserData(userId, 'UserContextMiddleware');
        if (!user) {
            return res.status(404).json({ success: false, message: "User profile not found." });
        }

        // 3. Attach to Request
        req.currentUser = user;
        next();

    } catch (err) {
        console.error("Context Middleware Error:", err);
        res.status(500).json({ success: false, message: "Server error loading user context." });
    }
}

module.exports = { loadUserContext };