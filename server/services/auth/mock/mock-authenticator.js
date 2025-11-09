/**
 * @file server/services/auth/mock/mock-authenticator.js
 * @description Universal mock authentication strategy. Sets a mock user ID
 * directly into the session for easy development/testing.
 * Strategy: AUTH_STRATEGY="MOCK"
 */

const express = require('express');
const router = express.Router();
const path = require('path');

const { findUserIdByEmail, logSuccessfulLogin } = require('../../../../models/db');

// Load .env relative to project root
require('dotenv').config({ path: path.resolve(__dirname, '../../../../', '.env') }); 

// Configuration loaded from .env
const MOCK_EMAIL = process.env.MOCK_EMAIL || 'test@mock.com';
const HOME_URL = '/'; // Final redirect URL

// =========================================================================
// MOCK HANDLER
// =========================================================================

/**
 * GET /api/auth/login
 * The single entry point for the mock strategy. Immediately processes the
 * mock user, sets the session, and redirects to the home page.
 * * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {void} Redirects the response.
 */
const handleMockLogin = async (req, res) => {
    try {
        const email = MOCK_EMAIL;
        
        console.log(`[MOCK] Attempting to log in as: ${email}`);
        
        // 1. Find User ID
        const userId = await findUserIdByEmail(email);
        
        if (!userId) {
            console.error(`Mock user email '${email}' not found.`);
            // Redirect to the universal failure route
            return res.redirect(302, `/api/auth/login-fail?error=mock_user_not_provisioned`); 
        }

        // 2. Set session and log login
        req.session.userId = userId;
        await logSuccessfulLogin(userId, req.ip || '127.0.0.1');
        
        // 3. Final redirect to /home
        return res.redirect(302, HOME_URL); 

    } catch (error) {
        console.error('Mock Login Error:', error);
        return res.redirect(302, `/api/auth/login-fail?error=mock_login_error`);
    }
};

router.get('/login', handleMockLogin);

module.exports = {
    router
};