/**
 * @file server/services/auth/sso/handlers/mock-sso-handler.js
 * @description Concrete implementation for Mock SSO mode handlers.
 * These functions implement the mode-specific steps of the SSO factory pattern.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../../../', '.env') }); 

const port = process.env.PORT || 3000;
const host = `${process.env.SERVER_HOST || 'localhost'}:${port}`
const MOCK_AUTH_URL = `http://${host}/api/auth/mock-sso`; 

/**
 * Handles the initial request to /api/auth/login, redirecting to the mock provider.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {void} Redirects the response.
 */
function initiateLogin(req, res) {
    // In mock mode, we redirect to our internal mock endpoint that simulates the external provider.
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/auth/callback`;
    const ssoRedirectUrl = `${MOCK_AUTH_URL}?redirect_uri=${callbackUrl}`;
    return res.redirect(302, ssoRedirectUrl);
}

/**
 * Simulates the external SSO service's login page success.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {void} Redirects the response back to the /callback route with mock data.
 */
function handleMockSso(req, res) {
    // Simulates the external service login success
    const mockEmail = `${process.env.MOCK_EMAIL || 'test@mock.com'}`;
    // Redirects back to the callback URL provided in the original request.
    const redirectBack = `${req.query.redirect_uri}?user_email=${mockEmail}`;
    return res.redirect(302, redirectBack);
}

/**
 * Extracts the verified user email from the incoming request (post-external login).
 * @param {object} req - Express request object.
 * @returns {string|null} The verified user email.
 */
async function getVerifiedEmail(req) {
    // In mock mode, the email is passed directly as a query parameter
    return req.query.user_email; 
}

module.exports = {
    initiateLogin,
    handleMockSso,
    getVerifiedEmail
};