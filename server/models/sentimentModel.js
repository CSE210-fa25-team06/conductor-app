/**
 * Sentiment Model - Handles all database operations related to sentiment entries
 */

const { pool } = require("./db");

/**
 * Create a new sentiment entry
 * @param {Object} sentimentData - The sentiment entry data
 * @param {number} sentimentData.user_id - The ID of the user creating the sentiment
 * @param {number} sentimentData.group_id - The ID of the user's group
 * @param {string} sentimentData.sentiment - The sentiment type ('happy', 'neutral', 'sad')
 * @param {string} sentimentData.comment - Optional comment about feelings
 * @returns {Promise<Object>} The created sentiment entry with its ID
 */
async function createSentimentEntry({ user_id, group_id, sentiment, comment = null }) {
  const query = `
    INSERT INTO sentiments (user_id, group_id, sentiment, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, group_id, sentiment, comment, created_at
  `;
  
  const values = [user_id, group_id, sentiment, comment];
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get all sentiment entries for a specific user
 * @param {number} user_id - The ID of the user
 * @returns {Promise<Array>} Array of sentiment entries ordered by created_at (newest first)
 */
async function getSentimentsByUserId(user_id) {
  const query = `
    SELECT id, user_id, group_id, sentiment, comment, created_at
    FROM sentiments
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  
  const result = await pool.query(query, [user_id]);
  return result.rows;
}

module.exports = { createSentimentEntry, getSentimentsByUserId };
