/**
 * Journal Model - Handles all database operations related to journal entries
 */

const { pool } = require("./db");

/**
 * Create a new journal entry
 * @param {Object} journalData - The journal entry data
 * @param {number} journalData.user_id - The ID of the user creating the journal
 * @param {number} journalData.group_id - The ID of the user's group
 * @param {string} journalData.entry_date - The date of the journal entry (YYYY-MM-DD format)
 * @param {string} journalData.did - What the user did
 * @param {string} journalData.doing_next - What the user plans to do next
 * @param {string} journalData.blockers - Any blockers the user is facing (optional)
 * @returns {Promise<Object>} The created journal entry with its ID
 */
async function createJournalEntry({ user_id, group_id, entry_date, did, doing_next, blockers = null }) {
  const query = `
    INSERT INTO journals (user_id, group_id, entry_date, did, doing_next, blockers)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, user_id, group_id, entry_date, did, doing_next, blockers, created_at
  `;
  
  const values = [user_id, group_id, entry_date, did, doing_next, blockers];
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get all journal entries for a specific user
 * @param {number} user_id - The ID of the user
 * @returns {Promise<Array>} Array of journal entries ordered by entry_date (newest first)
 */
async function getJournalsByUserId(user_id) {
  const query = `
    SELECT id, user_id, group_id, entry_date, did, doing_next, blockers, created_at
    FROM journals
    WHERE user_id = $1
    ORDER BY entry_date DESC, created_at DESC
  `;
  
  const result = await pool.query(query, [user_id]);
  return result.rows;
}

module.exports = { createJournalEntry, getJournalsByUserId };