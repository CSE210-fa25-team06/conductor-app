/**
 * @file server/services/auth/whitelist-manager.js
 * @description Centralized logic for validating user emails against the whitelist.
 */
const whitelistConfig = require('../../config/data/whitelist-config.json');

/**
 * Pure logic: Checks if an email is allowed based on the JSON config.
 * @param {string} email 
 * @returns {boolean}
 */
function isEmailAllowed(email) {
    if (!whitelistConfig.enabled) return true; // Bypass if disabled
    if (!email) return false;

    const normalizedEmail = email.toLowerCase();
    const domain = normalizedEmail.split('@')[1];

    // 1. Check exact email match
    if (whitelistConfig.allowed_emails.map(e => e.toLowerCase()).includes(normalizedEmail)) {
        return true;
    }

    // 2. Check domain match
    if (whitelistConfig.allowed_domains.includes(domain)) {
        return true;
    }

    return false;
}

/**
 * Express Middleware: Protects a route, ensuring the current user is whitelisted.
 * Useful for sensitive routes or preventing access if a user was removed from the whitelist later.
 */
function whitelistMiddleware(req, res, next) {
    // Assuming req.user is populated (e.g., via session)
    // We need to fetch the email from the user object. 
    // Based on your db.js, req.user is likely just an ID, so you might need to fetch the email
    // or ensure your deserializer attaches it. 
    // For this example, we assume req.user.email exists.
    
    const userEmail = req.user ? req.user.email : null;

    if (isEmailAllowed(userEmail)) {
        return next();
    }

    console.warn(`[ACCESS DENIED] Non-whitelisted user attempted access: ${userEmail}`);
    return res.status(403).json({ error: 'Access Denied: You are not on the whitelist.' });
}

module.exports = {
    isEmailAllowed,
    whitelistMiddleware
};