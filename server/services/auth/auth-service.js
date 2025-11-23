/**
 * @file server/services/auth-service.js
 * @description Service layer for orchestrating the user login process.
 * Separates core database retrieval (DAL) from business and logging logic.
 */

const { getFullUserData, logSuccessfulLogin } = require('../../models/db');

/**
 * Handles the complete user login process, retrieving data and logging the activity.
 * @param {number} userId - The internal database ID of the user.
 * @param {string} ipAddress - The IP address used during the login attempt.
 * @returns {object|null} The user object with roles and permissions, or null.
 */
async function handleUserLogin(userId, ipAddress) {
    try {
        // 1. Retrieve the user's data (DAL function)
        const userData = await getFullUserData(userId, ipAddress);

        if (userData) {
            // 2. Log the activity (Business/Logging function)
            await logSuccessfulLogin(userId, ipAddress);
        }

        return userData;

    } catch (error) {
        console.error('Auth Service Error in handleUserLogin:', error);
        throw error;
    }
}

module.exports = {
    handleUserLogin
};