// server/middleware/auth/requireAuth.js

/**
 * Middleware that ensures a user is authenticated before proceeding to a route.
 * Checks for a valid session using Passport's req.user (for Google) or 
 * the generic req.session.userId (for Mock SSO).
 */
function requireAuth(req, res, next) {
    // req.user is populated by Passport.js deserializeUser() after a successful Google login.
    // req.session.userId is manually populated for the Mock SSO strategy.
    const userId = req.user || req.session.userId;

    if (userId) {
        // User is authenticated. Attach the userId to the request for easy access in handlers.
        req.userId = userId;
        return next();
    } else {
        // User is NOT authenticated. Return a 401 Unauthorized response.
        return res.status(401).json({
            success: false,
            message: 'Authorization required. Please log in.'
        });
    }
}

module.exports = requireAuth;