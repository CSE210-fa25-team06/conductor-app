/**
 * @file server/services/auth/sso/sso-authenticator.js
 * @description Strategy factory: Creates a configured Express Router for SSO.
 * It contains all common authentication logic independent of the Real/Mock mode.
 * The mode-specific logic is injected via 'handlers'.
 */

const express = require('express');

const { 
    findUserIdByEmail, 
    findUserIdInUsers, 
} = require('../../../models/db');

const {
    createUserAccount,
    linkProviderAccount
} = require('../../../services/user-provisioning');

// The final URL the server redirects the client to after successful internal authentication.
const HOME_URL = '/dashboard.html'; 

/**
 * Creates and returns an Express Router configured for a specific SSO mode.
 * * @param {object} handlers - The object containing mode-specific handler functions (initiateLogin, getVerifiedEmail, [handleMockSso]).
 * @param {string} mode - The current operational mode (e.g., 'MOCK' or 'REAL').
 * @returns {express.Router} The configured router.
 * @throws {Error} If critical handler functions are missing.
 */
function createSsoRouter(handlers, mode) {
    const router = express.Router();
    const PROVIDER_NAME = `sso-${mode.toLowerCase()}`;
    
    // Ensure critical handlers are present
    if (!handlers.initiateLogin || !handlers.getVerifiedEmail) {
        throw new Error(`SSO Handler setup error: Missing handlers for mode ${mode}.`);
    }

    // =========================================================================
    // 1. /login: Mode-Specific Redirect (Delegated Logic)
    // =========================================================================
    /**
     * GET /api/auth/login
     * Initiates the SSO flow by redirecting to the external provider (or a mock).
     */
    router.get('/login', handlers.initiateLogin);

    // 2. /mock-sso: Only for Mock Mode to simulate the external provider
    if (handlers.handleMockSso) {
        /**
         * GET /api/auth/mock-sso
         * Simulates a successful login from the external SSO provider (Mock Mode only).
         */
        router.get('/mock-sso', handlers.handleMockSso);
    }
    
    // =========================================================================
    // 3. /callback: Common Authentication Core (Shared Logic)
    // =========================================================================
    /**
     * GET /api/auth/callback
     * The callback endpoint that the external provider redirects back to.
     */
    router.get('/callback', async (req, res) => {
        try {
            // STEP 1: Get the verified email from the mode-specific handler (Real or Mock)
            const email = await handlers.getVerifiedEmail(req);

            if (!email) {
                return res.redirect(302, '/api/auth/login-fail?error=auth_failed');
            }

            // Provisioning Logic
            let userId = await findUserIdByEmail(email);

            if (!userId) {
                userId = await findUserIdInUsers(email);
                const tokenPlaceholder = 'sso-token';
                const displayName = email.split('@')[0];

                if (userId) {
                    await linkProviderAccount(userId, PROVIDER_NAME, email, tokenPlaceholder, tokenPlaceholder);
                } else {
                    userId = await createUserAccount(PROVIDER_NAME, email, displayName, tokenPlaceholder, tokenPlaceholder);
                }
            }

            if (!userId) {
                return res.redirect(302, `/api/auth/login-fail?error=user_provisioning_failed`);
            }

            // FIX: Use Passport's req.login()
            req.login(userId, (err) => {
                if (err) {
                    console.error(`[SSO-${mode}] Login Error:`, err);
                    return next(err);
                }
                return res.redirect(302, HOME_URL);
            });

        } catch (error) {
            console.error(`[SSO-${mode}] Callback Handler Error:`, error);
            return res.redirect(302, `/api/auth/login-fail?error=callback_error`);
        }
    });

    return router;
}

module.exports = {
    createSsoRouter
};