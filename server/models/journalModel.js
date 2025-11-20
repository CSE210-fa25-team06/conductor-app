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
 * Update an existing journal entry
 * Only did, doing_next, blockers are editable
 */
async function updateJournalEntry({ id, did, doing_next, blockers = null }) {
  const query = `
    UPDATE journals
    SET did = $2,
        doing_next = $3,
        blockers = $4,
        edited_at = NOW()
    WHERE id = $1
    RETURNING id, user_id, group_id, entry_date, did, doing_next, blockers, created_at, edited_at
  `;

  const values = [id, did, doing_next, blockers];
  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = { createJournalEntry, updateJournalEntry };