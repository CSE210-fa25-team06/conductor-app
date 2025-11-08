/**
 * @file server/middleware/auth.js
 * @description Express Router (Controller) for handling all authentication-related API endpoints:
 * /api/auth/login, /api/auth/logout, and /api/auth/session.
 */

const express = require('express');
const router = express.Router();

// Import Model functions (Data Access Layer)
const {
  findUserIdByEmail,
  getFullUserData,
  logSuccessfulLogin
} = require('../models/db'); // Path adjusted based on MVC structure discussion: models/db.js


// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Helper function to retrieve user data, log a successful login, and send the final response.
 * @param {number} userId - The ID of the authenticated user.
 * @param {object} res - The Express response object.
 * @returns {Promise<void>} Sends the JSON response back to the client.
 */
const sendUserResponse = async (userId, res) => {
    // 1. Retrieve full user data from the database
    const userData = await getFullUserData(userId);
    if (!userData) {
        // Should not happen if userId is valid, indicates an internal DB issue.
        return res.status(500).json({ error: 'Internal error: User data retrieval failed.' });
    }
    
    // 2. Log Successful Login (non-blocking)
    // Get client IP address for logging (or default to localhost)
    const ipAddress = res.req.ip || '127.0.0.1'; 
    await logSuccessfulLogin(userId, ipAddress);

    // 3. Return the user data
    return res.status(200).json({
      success: true,
      user: userData,
      message: `Welcome back, ${userData.name}!`,
    });
};


// =========================================================================
// ROUTES
// =========================================================================

/**
 * 1. POST /api/auth/login
 * Logs the user in by validating email (mock login) and setting the session.
 * * @param {object} req.body - Expected to contain { email: string }.
 */
router.post('/login', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required for mock login.' });
  }

  try {
    // 1. Find User ID by email from the user_auth table
    const userId = await findUserIdByEmail(email);
    
    if (!userId) {
      // User does not exist in the database
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // 2. Set the session variable
    req.session.userId = userId;

    // 3. Complete login, log event, and send user data response
    return sendUserResponse(userId, res);

  } catch (error) {
    console.error('Login Route Handler Error:', error);
    return res.status(500).json({ error: 'An internal server error occurred during login.' });
  }
});


/**
 * 2. GET /api/auth/session
 * Retrieves the current authenticated user's data from the session (used for app bootstrapping/reloading).
 */
router.get('/session', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    // No session/user ID is found
    return res.status(401).json({
      success: false,
      user: null,
      message: 'No active session found.'
    });
  }

  try {
    // Retrieve full user data
    const userData = await getFullUserData(userId);

    if (!userData) {
      // Session exists, but DB user record is missing (inconsistent state)
      req.session.destroy(); // Clear invalid session
      return res.status(404).json({ error: 'Session data is invalid. User record not found.' });
    }
    
    // Return the user data
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
 * 3. POST /api/auth/logout
 * Destroys the current user session and clears the session cookie.
 */
router.post('/logout', (req, res) => {
  if (!req.session.userId) {
    // No active session, so nothing to destroy
    return res.status(200).json({
      success: true,
      message: 'No active session to log out from.'
    });
  }

  // Destroy the session and clear the cookie
  req.session.destroy(err => {
    if (err) {
      console.error('Logout failed:', err);
      return res.status(500).json({ success: false, error: 'Failed to clear session.' });
    }
    // Successfully destroyed session
    res.clearCookie('connect.sid'); // Clear the session cookie from the browser
    return res.status(200).json({ success: true, message: 'Successfully logged out.' });
  });
});


module.exports = router;