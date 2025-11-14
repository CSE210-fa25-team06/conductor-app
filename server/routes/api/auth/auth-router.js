/**
 * @file server/routes/api/auth/auth-router.js
 * @description The main authentication router. Mounts strategy-specific routes
 * and defines generic application-level routes (/session, /logout, /login-fail).
 */

const express = require('express');
const router = express.Router();

const loadAuthStrategyRoutes = require('../../../middleware/auth/auth-mounter'); 

const { getFullUserData } = require('../../../models/db'); // Needed for /session

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
 * Retrieves the current authenticated user's data from the session.
 * * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {object} JSON response with success status and user data, or 401.
 */
router.get('/session', async (req, res) => {
  // Check both generic session variable (for SSO/Mock) and Passport's req.user (for Google)
  const userId = req.session.userId || req.user; 

  if (!userId) {
    return res.status(401).json({
      success: false,
      user: null,
      message: 'No active session found.'
    });
  }

  try {
    const userData = await getFullUserData(userId);

    if (!userData) {
      // User ID found in session/passport but no corresponding data in DB
      req.session.destroy();
      return res.status(401).json({
        success: false,
        user: null,
        message: 'Invalid session: User data not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Session Route Handler Error:', error);
    return res.status(500).json({ error: 'An internal server error occurred retrieving session data.' });
  }
});


/**
 * POST /api/auth/logout
 * Destroys the current user session and clears the session cookie.
 * * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {object} JSON response with success status.
 */
router.post('/logout', (req, res) => {
  // Use Passport's req.logout if available, otherwise fall back to manual session destroy
  if (req.logout) {
      // Passport method
      req.logout(err => {
        if (err) {
          console.error('Passport Logout failed:', err);
          return res.status(500).json({ success: false, error: 'Failed to clear session.' });
        }
        res.clearCookie('connect.sid'); 
        return res.status(200).json({ success: true, message: 'Successfully logged out.' });
      });
  } else if (req.session.userId) {
    // Session-only method (for Mock/SSO)
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
 * * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {void} Redirects the response.
 */
router.get('/login-fail', (req, res) => {
    const errorMessage = req.query.error ? `?error=${req.query.error}` : '';
    console.log(`[AUTH] Failed login fallback triggered. Redirecting to /${errorMessage}`);
    
    // Redirects to the client's root URL (e.g., 'http://localhost:3000/')
    return res.redirect(302, `/${errorMessage}`);
});

module.exports = router;