/**
 * @file server/models/db.js
 * @description Data Access Layer (DAL) for the application.
 * This module establishes the **connection pool** to the PostgreSQL database (using the `pg` library)
 * and exports core functions for user authentication and user data retrieval. It acts as the primary
 * interface for all low-level database operations.
 * NOTE: Functions related to user creation and account linking are currently here but are candidates 
 * for migration to a dedicated Service Layer in future refactoring for better separation of concerns.
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../', '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.SERVER_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

/**
 * Looks up a user's internal ID based on their email in the user_auth table.
 * @param {string} email - The email address from the authentication provider.
 * @returns {number|null} The user's internal database ID, or null if not found.
 */
async function findUserIdByEmail(email) {
  const query = `
    SELECT user_id
    FROM user_auth
    WHERE email = $1;
  `;
  try {
    const result = await pool.query(query, [email]);
    return result.rows.length > 0 ? result.rows[0].user_id : null;
  } catch (error) {
    console.error('Database Error in findUserIdByEmail:', error);
    throw error;
  }
}

/**
 * Backup lookup for a user's internal ID in the main users table (for migration/linking).
 * @param {string} email - The email address.
 * @returns {number|null} The user's internal database ID, or null if not found.
 */
async function findUserIdInUsers(email) {
  const query = `
    SELECT id AS user_id
    FROM users
    WHERE email = $1;
  `;
  try {
    const result = await pool.query(query, [email]);
    return result.rows.length > 0 ? result.rows[0].user_id : null;
  } catch (error) {
    console.error('Database Error in findUserIdInUsers:', error);
    throw error;
  }
}

/**
 * Retrieves a user's full data set based on their internal ID.
 * @param {number} userId - The user's internal database ID.
 * @returns {object|null} The full user data object, or null if not found.
 */
async function getFullUserData(userId) {
  const query = `
    SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.photo_url,
        g.name AS group_name,
        ARRAY_AGG(r.name) AS roles_list
    FROM users u
    LEFT JOIN groups g ON u.group_id = g.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.id = $1
    GROUP BY u.id, u.email, u.name, u.photo_url, g.name;
  `;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Database Error in getFullUserData:', error);
    throw error;
  }
}


/**
 * Logs a successful user login event in the activity_log table.
 * (Currently a stub, but intended for auditing)
 * @param {number} userId - The ID of the user who logged in.
 * @param {string} ipAddress - The IP address of the user.
 * @returns {void}
 */
async function logSuccessfulLogin(userId, ipAddress) {
  console.log(`[DB] Audit: Login successful for User ID: ${userId} from IP: ${ipAddress}`);
  // INSERT INTO activity_log (user_id, type, ip_address) VALUES ($1, 'LOGIN', $2);
}


/**
 * Provisions a BRAND NEW user (in a transaction) by inserting records into 
 * the 'users' and 'user_auth' tables.
 * NOTE: This function should be moved to a Service Layer.
 * @param {string} email - The user's email.
 * @param {string} name - The user's display name.
 * @param {string} accessToken - Google Access Token.
 * @param {string} refreshToken - Google Refresh Token (optional).
 * @returns {number} The newly created user's internal database ID.
 */
async function createGoogleUser(email, name, accessToken, refreshToken) {
    // Start Transaction
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert into users table
        const userInsertQuery = `
            INSERT INTO users (email, name, photo_url)
            VALUES ($1, $2, 'https://example.com/default-photo.png') 
            RETURNING id;
        `;
        const userResult = await client.query(userInsertQuery, [email, name]);
        const userId = userResult.rows[0].id;

        // 2. Insert into user_auth table for Google strategy linkage
        const nonNullRefreshToken = refreshToken || ''; 
        const authInsertQuery = `
            INSERT INTO user_auth (user_id, provider, email, access_token, refresh_token)
            VALUES ($1, $2, $3, $4, $5);
        `;
        await client.query(authInsertQuery, [userId, 'google', email, accessToken, nonNullRefreshToken]);
        
        await client.query('COMMIT');
        
        console.log(`[DB] New user provisioned: ${email} (ID: ${userId})`);
        return userId;
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Transaction Error in createGoogleUser:', e);
        throw e;
    } finally {
        client.release();
    }
}


/**
 * Links a missing provider record for an EXISTING user by inserting a record 
 * into the 'user_auth' table.
 * NOTE: This function should be moved to a Service Layer.
 * @param {number} userId - The existing user's internal database ID.
 * @param {string} email - The user's email.
 * @param {string} accessToken - Google Access Token.
 * @param {string} refreshToken - Google Refresh Token (optional).
 * @returns {number} The existing user's internal database ID.
 */
async function linkGoogleAccount(userId, email, accessToken, refreshToken) {
    const nonNullRefreshToken = refreshToken || ''; 
    const authInsertQuery = `
        INSERT INTO user_auth (user_id, provider, email, access_token, refresh_token)
        VALUES ($1, $2, $3, $4, $5);
    `;
    await pool.query(authInsertQuery, [userId, 'google', email, accessToken, nonNullRefreshToken]);
    
    console.log(`[DB] Existing user linked to Google provider: ${email} (ID: ${userId})`);
    return userId;
}


module.exports = {
  findUserIdByEmail,
  findUserIdInUsers,
  getFullUserData,
  logSuccessfulLogin,
  createGoogleUser, 
  linkGoogleAccount,
};