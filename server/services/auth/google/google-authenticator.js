/**
 * @file server/services/auth/google/google-authenticator.js
 * @description Passport strategy configuration and router for Google OAuth 2.0.
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const express = require('express');
const router = express.Router(); 

// NOTE: This file currently calls DB functions directly. It is a candidate for Service Layer abstraction.
const { 
    findUserIdByEmail, 
    findUserIdInUsers, // Not used in this version but imported
    logSuccessfulLogin, 
    createGoogleUser, 
    linkGoogleAccount
} = require('../../../models/db'); 

// --- Passport Initialization ---
// NOTE: app.use(passport.initialize()) and app.use(passport.session()) must be called in app.js.

/**
 * Serializer: Stores only the user's database ID in the session.
 * @param {number} userId - The user's internal database ID.
 * @param {Function} done - Callback function.
 */
passport.serializeUser((userId, done) => {
    done(null, userId);
});

/**
 * Deserializer: Uses the ID from the session to retrieve the user object/ID.
 * @param {number} userId - The user's internal database ID retrieved from the session.
 * @param {Function} done - Callback function.
 */
passport.deserializeUser(async (userId, done) => {
    // Currently returns only the ID, relying on /session to fetch full data.
    done(null, userId); 
});

// --- Google Strategy Setup (Configure Strategy, it runs once) ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, 
    /**
     * The verify callback function executed after Google sends back the user data.
     * @param {string} accessToken - Google Access Token.
     * @param {string} refreshToken - Google Refresh Token (optional).
     * @param {object} profile - User profile information from Google.
     * @param {Function} done - Passport callback (err, user, info).
     */
    async (accessToken, refreshToken, profile, done) => {
        try {
            const googleEmail = profile.emails[0].value;
            const googleName = profile.displayName;

            // 1. Find User ID in our database using the verified email
            let userId = await findUserIdByEmail(googleEmail);

            // =========================================================================
            // NOTE: This logic handles BOTH creation and linking in one flow.
            // =========================================================================
            if (!userId) {
                // User is not in user_auth. Check if user exists in the main users table (manual creation/migration)
                userId = await findUserIdInUsers(googleEmail);
                
                if (userId) {
                    // Case 2: User exists in 'users' but not 'user_auth'. Link the account.
                    await linkGoogleAccount(userId, googleEmail, accessToken, refreshToken);
                } else {
                    // Case 3: User is brand new. Create the user and link the account.
                    userId = await createGoogleUser(googleEmail, googleName, accessToken, refreshToken);
                }
            }
            
            if (!userId) {
                // Should not happen if createGoogleUser worked
                return done(null, false, { message: 'User not provisioned.' });
            }

            // 2. Log Successful Login (non-blocking)
            const ipAddress = '127.0.0.1'; 
            await logSuccessfulLogin(userId, ipAddress);

            // 3. Success: Pass our internal user ID to the serializer/session
            return done(null, userId);

        } catch (error) {
            console.error('Google OAuth Verification Error:', error);
            // This error will trigger the failureRedirect
            return done(error, null); 
        }
    }
));

// =========================================================================
// PASSPORT ROUTER CONFIGURATION
// =========================================================================

/**
 * GET /api/auth/google
 * Route to initiate the Google OAuth login flow.
 */
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        // Request a refresh token to satisfy the NOT NULL constraint (required for long-term access)
        accessType: 'offline', 
        prompt: 'consent' // Forces consent screen to show, ensuring refresh_token is returned
    })
);

/**
 * GET /api/auth/google/callback
 * Route that Google redirects back to after the user signs in.
 */
router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/api/auth/login-fail?error=google_failed', 
    }),
    /**
     * Success Handler: Runs only if authentication is successful.
     */
    (req, res) => {
        // req.user is populated by Passport's deserializeUser
        // Final redirect to the client's home page
        res.redirect('/'); 
    }
);

module.exports = {
    router,
    passport // Export the configured Passport instance for use in app.js
};