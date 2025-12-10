/**
 * @file server/services/auth/google/google-authenticator.js
 * @description Passport strategy configuration and router for Google OAuth 2.0.
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const express = require('express');
const router = express.Router(); 

const { 
    findUserIdByEmail, 
    findUserIdInUsers,
    logSuccessfulLogin, 
} = require('../../../models/db'); 

const {
    createUserAccount,
    linkProviderAccount
} = require('../../../services/user-provisioning');

const { isEmailAllowed } = require('../whitelist-manager');

// The provider name to be passed to the provisioning service
const PROVIDER_NAME = 'google';

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
    callbackURL: process.env.OAUTH_REDIRECT_URL
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

            // EXTRACT PHOTO: Get the first photo URL if available
            const googlePhotoUrl = (profile.photos && profile.photos.length > 0) 
                ? profile.photos[0].value 
                : null;
            
            // --- 1. CENTRALIZED CHECK ---
            if (!isEmailAllowed(googleEmail)) {
                console.warn(`[AUTH BLOCKED] ${googleEmail} is not whitelisted.`);
                return done(null, false, { message: 'email_not_authorized' });
            }
 
            // 2. Proceed to Provisioning (lines 63+ in your original file)
            let userId = await findUserIdByEmail(googleEmail); //

            if (!userId) {
                // User is not in user_auth. Check if user exists in the main users table (manual creation/migration)
                userId = await findUserIdInUsers(googleEmail);
                
                if (userId) {
                    // Case 2: User exists in 'users' but not 'user_auth'. Link the account.
                    await linkProviderAccount(userId, PROVIDER_NAME, googleEmail, accessToken, refreshToken);
                } else {
                    // Case 3: User is brand new. Create the user and link the account.
                    userId = await createUserAccount(PROVIDER_NAME, googleEmail, googleName, accessToken, refreshToken, googlePhotoUrl);
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

router.get('/login', (req, res) => {
    res.redirect('/api/auth/google');
});


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
router.get('/callback/google', (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        // 1. System/Network Errors
        if (err) { 
            console.error('Google Auth Error:', err);
            return res.redirect('/index.html?error=server_error'); 
        }

        // 2. Authentication Failure (Whitelist or User not found)
        if (!user) {
            // Extract the message we set in the strategy (e.g., "Email not authorized")
            const failureMessage = info && info.message ? info.message : 'login_failed';
            
            // Encode it safely for the URL
            const code = encodeURIComponent(failureMessage);
            
            // Redirect to frontend with the specific reason
            return res.redirect(`/index.html?error=${code}`);
        }

        // 3. Success: Log the user in manually
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                return next(loginErr);
            }
            return res.redirect('/dashboard.html');
        });

    })(req, res, next); // <--- Immediate invocation of the middleware
});

module.exports = {
    router,
    passport // Export the configured Passport instance for use in app.js
};