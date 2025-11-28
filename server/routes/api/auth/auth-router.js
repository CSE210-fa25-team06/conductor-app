/**
 * @file server/routes/api/auth/auth-router.js
 * @description The main authentication router. Mounts strategy-specific routes
 * and defines generic application-level routes (/session, /logout, /login-fail).
 */

const express = require('express');
const router = express.Router();

const loadAuthStrategyRoutes = require('../../../middleware/auth/auth-mounter'); 

const { handleUserLogin } = require('../../../services/auth/auth-service');

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
router.get('/session', async (req, res) => {
  /**
   * @swagger
   * #swagger.tags = ['Auth']
   * #swagger.summary = 'Check user session'
   * #swagger.description = 'Returns the currently authenticated user.'
   * #swagger.responses[200] = { description: "Authenticated" }
   * #swagger.responses[401] = { description: "Not authenticated" }
   */
  if (req.isAuthenticated()) {
    const userId = req.user || req.session.userId; 

    try {
      const userData = await handleUserLogin(userId, req.ip);

      if (userData) {
        return res.status(200).json({ 
          success: true, 
          user: userData, 
          message: 'Session valid.' 
        });
      } else {
        // User ID exists in session, but user data not found (Stale session)
        console.warn(`[AUTH] Stale session detected for user ID ${userId}. Forcing logout.`);
        
        req.logout(err => {
          if (err) console.error('Auto-Logout failed:', err);
          return res.status(401).json({ success: false, message: 'Invalid session. User data not found. Forced logout.' });
        });
        return; 
      }
    } catch (error) {
      console.error('[AUTH] Error validating session:', error);
      
      // Destroy the session to prevent loops if the session data is corrupt
      // or causing backend errors.
      req.session.destroy((err) => {
        if (err) console.error('Session destruction failed during error handling:', err);
        
        res.clearCookie('connect.sid');
        return res.status(500).json({ 
          success: false, 
          error: 'Internal Server Error during session validation.' 
        });
      });
      return;
    }
  } 

  return res.status(401).json({ 
    success: false, 
    message: 'User is not authenticated.' 
  });
});

router.get('/logout', (req, res) => {
  /**
   * @swagger
   * #swagger.tags = ['Auth']
   * #swagger.summary = 'Logout user'
   * #swagger.description = 'Destroys session and clears cookie.'
   * #swagger.responses[200] = { description: "Logged out" }
   */
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

router.get('/login-fail', (req, res) => {
  /**
   * @swagger
   * #swagger.tags = ['Auth']
   * #swagger.summary = 'Authentication failed handler'
   * #swagger.description = 'Redirects user to login page.'
   */
    const errorMessage = req.query.error ? `?error=${req.query.error}` : '';
    console.warn(`Authentication failed. Redirecting to login page with error: ${errorMessage}`);
    // Redirect the client-side app back to the login page (index.html)
    res.redirect(`/index.html${errorMessage}`);
});

module.exports = router;