/**
 * @file server/models/db.js
 * @description Data Access Layer (Model) for core authentication and user-related database operations.
 * It manages the PostgreSQL connection pool and contains all direct database query logic.
 */

const { Pool } = require('pg');
const path = require('path');

// CRITICAL: Load environment variables before initializing the Pool
// Path is relative to db/ up two directories (../../) to the project root for the .env file.
require('dotenv').config({ path: path.resolve(__dirname, '../../', '.env') });

// =========================================================================
// DATABASE CONNECTION POOL
// =========================================================================

/**
 * PostgreSQL connection pool initialized with credentials from environment variables.
 * @type {Pool}
 */
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.SERVER_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


// =========================================================================
// MODEL FUNCTIONS
// =========================================================================

/**
 * Finds the user's ID using their email from the user_auth table.
 * @param {string} email - The user's email address.
 * @returns {Promise<number|null>} The user_id if found, otherwise null.
 */
async function findUserIdByEmail(email) {
  const query = `
    SELECT user_id
    FROM user_auth
    WHERE email = $1;
  `;
  try {
    const result = await pool.query(query, [email]);
    if (result.rows.length > 0) {
      return result.rows[0].user_id;
    }
    return null; // User not found in user_auth
  } catch (error) {
    console.error('Database Error in findUserIdByEmail:', error);
    throw error;
  }
}

/**
 * Fetches complete user, role, and group data for a valid user ID.
 * Aggregates roles into an array and fetches group name.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object|null>} An object containing denormalized user data, or null.
 */
async function getFullUserData(userId) {
  const query = `
    SELECT
        u.id AS user_id,
        u.name,
        u.email,
        u.photo_url,
        g.name AS group_name,
        -- Aggregate all roles for the user into a JSON array (or similar format)
        array_remove(array_agg(r.name), NULL) AS roles_list,
        u.availability
    FROM
        users u
    LEFT JOIN
        groups g ON u.group_id = g.id
    LEFT JOIN
        user_roles ur ON u.id = ur.user_id
    LEFT JOIN
        roles r ON ur.role_id = r.id
    WHERE
        u.id = $1
    GROUP BY
        u.id, g.name;
  `;
  try {
    const result = await pool.query(query, [userId]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null; // User not found in users table
  } catch (error) {
    console.error('Database Error in getFullUserData:', error);
    throw error;
  }
}

/**
 * Logs a successful login event in the activity_log table.
 * This function is fire-and-forget (non-critical path logging).
 * @param {number} userId - The ID of the user who logged in.
 * @param {string} ipAddress - The IP address of the user.
 */
async function logSuccessfulLogin(userId, ipAddress) {
  // Assuming 'USER_LOGIN_SUCCESS' activity has ID = 1
  const activityId = 1; 
  const content = { ip_address: ipAddress };

  // Find the user's group ID to include in the log
  const findGroupQuery = 'SELECT group_id FROM users WHERE id = $1;';
  let groupId = null;
  try {
    const groupResult = await pool.query(findGroupQuery, [userId]);
    if (groupResult.rows.length > 0) {
      groupId = groupResult.rows[0].group_id;
    }
  } catch (error) {
    console.warn('Could not find group_id for logging, proceeding with NULL', error);
  }

  const logQuery = `
    INSERT INTO activity_log (user_id, group_id, activity_id, content)
    VALUES ($1, $2, $3, $4);
  `;

  try {
    await pool.query(logQuery, [userId, groupId, activityId, content]);
    // console.log(`Login logged for user ${userId}`);
  } catch (error) {
    console.error('Database Error in logSuccessfulLogin:', error);
    // Note: Logging failure should not block the main request flow.
  }
}


// Export the core functions for the Controller (Router) to use
module.exports = {
  findUserIdByEmail,
  getFullUserData,
  logSuccessfulLogin,
};