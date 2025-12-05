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

/**
 * Get a single sentiment entry by ID
 */
async function getSentimentById(id) {
  const query = `
    SELECT id, user_id, group_id, sentiment, comment, created_at, updated_at
    FROM sentiments
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Update a sentiment entry
 */
async function updateSentimentEntry({ id, sentiment, comment }) {
  const query = `
    UPDATE sentiments
    SET sentiment = $1,
        comment = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING id, user_id, group_id, sentiment, comment, created_at, updated_at
  `;
  const result = await pool.query(query, [sentiment, comment || null, id]);
  return result.rows[0];
}

/**
 * Delete a sentiment entry
 */
async function deleteSentimentEntry(id) {
  await pool.query(`DELETE FROM sentiments WHERE id = $1`, [id]);
}

module.exports = { createSentimentEntry, getSentimentsByUserId, getSentimentById, updateSentimentEntry, deleteSentimentEntry };
