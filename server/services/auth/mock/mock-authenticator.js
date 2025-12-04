/**
 * @file server/services/auth/mock/mock-authenticator.js
 * @description Universal mock authentication strategy. Sets a mock user ID
 * directly into the session for easy development/testing.
 * Strategy: AUTH_STRATEGY="MOCK"
 */

const express = require('express');
const router = express.Router();
const path = require('path');

const { 
    findUserIdByEmail, 
    findUserIdInUsers,
} = require('../../../models/db');

const {
    createUserAccount,
    linkProviderAccount
} = require('../../../services/user-provisioning');

// Load .env relative to project root
require('dotenv').config({ path: path.resolve(__dirname, '../../../../', '.env') }); 

// Configuration loaded from .env
const MOCK_EMAIL = process.env.MOCK_EMAIL || 'test@mock.com';
const HOME_URL = '/dashboard.html'; 
const PROVIDER_NAME = 'mock';


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
const handleMockLogin = async (req, res, next) => { // Added 'next'
    try {
        const email = MOCK_EMAIL;
        const name = 'Mock User'; 
        
        console.log(`[MOCK] Attempting to log in as: ${email}`);
        
        // 1. Provisioning Logic
        let userId = await findUserIdByEmail(email);
        
        if (!userId) {
            userId = await findUserIdInUsers(email);
            const mockToken = 'mock-token';
            
            if (userId) {
                await linkProviderAccount(userId, PROVIDER_NAME, email, mockToken, mockToken);
            } else {
                userId = await createUserAccount(PROVIDER_NAME, email, name, mockToken, mockToken);
            }
        }

        if (!userId) {
            return res.redirect(302, `/api/auth/login-fail?error=mock_provisioning_failed`); 
        }
        
        // 2. FIX: Use Passport's req.login() instead of manual session setting.
        // This ensures req.user is populated and the session is saved correctly.
        req.login(userId, (err) => {
            if (err) { 
                console.error('Passport Login Error:', err);
                return next(err); 
            }
            // Session is now saved. Redirect to home.
            return res.redirect(302, HOME_URL); 
        });

    } catch (error) {
        console.error('Mock Login Error:', error);
        return res.redirect(302, `/api/auth/login-fail?error=mock_login_error`);
    }
};

router.get('/login', handleMockLogin);

module.exports = { router };