/**
 * @file server/routes/api/auth/auth-router.js
 * @description The main authentication router. Mounts strategy-specific routes
 * and defines generic application-level routes (/session, /logout, /login-fail).
 */

const express = require('express');
const router = express.Router();

const loadAuthStrategyRoutes = require('../../../middleware/auth/auth-mounter'); 

const { handleUserLogin } = require('../../../services/auth/auth-service'); // Needed for /session

// =========================================================================
// 1. STRATEGY-SPECIFIC ROUTES (Mounted by the Mounter)
// =========================================================================

/**
 * Dynamically loads and mounts the routes for the active authentication strategy
 * (e.g., /google, /login, /callback).
 */
router.use(loadAuthStrategyRoutes());


// =========================================================================
// 2. GENERIC API ROUTES (Common to ALL strategies)
// =========================================================================

/**
 * GET /api/auth/session
 * Retrieves the current authenticated user's data from the session, and logs a successful session check.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {object} JSON response with success status and user data, or 401.
 */
router.get('/session', async (req, res) => {
  if (req.isAuthenticated()) {
    const userId = req.user || req.session.userId; 

    // --- CRITICAL FIX 3: Robust check and auto-logout ---
    const userData = await handleUserLogin(userId, req.ip);

    if (userData) {
      return res.status(200).json({ 
        success: true, 
        user: userData, 
        message: 'Session valid.' 
      });
    } else {
      // User ID exists in session, but we could not fetch user data (user deleted, etc.)
      console.warn(`[AUTH] Stale session detected for user ID ${userId}. Forcing logout.`);
      // Passport's req.logout() clears the session and the session cookie.
      req.logout(err => {
        if (err) console.error('Auto-Logout failed:', err);
        // Respond with 401 Unauthorized after attempting to clear the session
        return res.status(401).json({ success: false, message: 'Invalid session. User data not found. Forced logout.' });
      });
      return; // Stop execution after sending the 401 response
    }
  }
});


/**
 * GET /api/auth/logout
 * Logs out the user by destroying the session. Supports both Passport and session-only methods.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {object} JSON response with success status.
 */
router.get('/logout', (req, res) => {
  // Passport-specific logout method (clears req.user and session)
  if (req.user) {
      req.logout((err) => {
        if (err) {
            console.error('Passport Logout failed:', err);
            return res.status(500).json({ success: false, error: 'Failed to log out.' });
        }
        // Clear the session cookie regardless of how logout was handled
        res.clearCookie('connect.sid'); 
        return res.status(200).json({ success: true, message: 'Successfully logged out.' });
      });
  } else if (req.session.userId) {
    // Session-only method (for Mock/SSO or non-Passport sessions)
    req.session.destroy(err => {
      if (err) {
        console.error('Session Logout failed:', err);
        return res.status(500).json({ success: false, error: 'Failed to clear session.' });
      }
      res.clearCookie('connect.sid'); 
      return res.status(200).json({ success: true, message: 'Successfully logged out.' });
    });
  } else {
    // Already logged out or no session to begin with
    res.clearCookie('connect.sid'); 
    return res.status(200).json({ success: true, message: 'No active session found, cookie cleared.' });
  }
});


/**
 * GET /api/auth/login-fail
 * Universal route for all authentication strategies to redirect to upon failure.
 * Redirects the client to the root URL, optionally with an error query parameter.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {void} Redirects the response.
 */
router.get('/login-fail', (req, res) => {
    const errorMessage = req.query.error ? `?error=${req.query.error}` : '';
    console.warn(`Authentication failed. Redirecting to login page with error: ${errorMessage}`);
    // Redirect the client-side app back to the login page (index.html)
    res.redirect(`/index.html${errorMessage}`);
});

module.exports = router;