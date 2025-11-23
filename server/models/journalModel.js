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


// Helper Query: Reusable SQL to fetch Journal + Author Name + Group + Roles
const BASE_JOURNAL_QUERY = `
    SELECT 
        j.id, j.user_id, j.group_id, j.entry_date, j.did, j.doing_next, j.blockers, j.created_at, j.edited_at,
        u.name AS author_name,
        COALESCE(g.name, 'Unassigned') AS group_name,
        STRING_AGG(DISTINCT r.name, ' • ' ORDER BY r.name ASC) AS author_roles
    FROM journals j
    JOIN users u ON j.user_id = u.id
    LEFT JOIN groups g ON j.group_id = g.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
`;

const GROUP_BY_ORDER = `
    GROUP BY j.id, u.name, g.name
    ORDER BY j.created_at DESC
`;


async function createJournalEntry({ user_id, group_id, entry_date, did, doing_next, blockers = null }) {
  // Insert the entry
  const query = `
    INSERT INTO journals (user_id, group_id, entry_date, did, doing_next, blockers)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id;
  `;
  const result = await pool.query(query, [user_id, group_id, entry_date, did, doing_next, blockers]);
  
  // Immediately fetch the formatted record (with roles) to return to UI
  return await getJournalById(result.rows[0].id);
}

async function updateJournalEntry({ id, did, doing_next, blockers = null }) {
  const query = `
    UPDATE journals
    SET did = $2, doing_next = $3, blockers = $4, edited_at = NOW()
    WHERE id = $1
    RETURNING id;
  `;
  const result = await pool.query(query, [id, did, doing_next, blockers]);
  return await getJournalById(result.rows[0].id);
}

async function deleteJournalEntry(id) {
  return await pool.query("DELETE FROM journals WHERE id = $1", [id]);
}

async function getAllJournals() {
  const query = `${BASE_JOURNAL_QUERY} ${GROUP_BY_ORDER}`;
  const result = await pool.query(query);
  return result.rows;
}

async function getJournalsByGroup(groupId) {
  const query = `${BASE_JOURNAL_QUERY} WHERE j.group_id = $1 ${GROUP_BY_ORDER}`;
  const result = await pool.query(query, [groupId]);
  return result.rows;
}

async function getJournalsByUser(userId) {
  const query = `${BASE_JOURNAL_QUERY} WHERE j.user_id = $1 ${GROUP_BY_ORDER}`;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function getJournalById(id) {
  const query = `${BASE_JOURNAL_QUERY} WHERE j.id = $1 ${GROUP_BY_ORDER}`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

module.exports = { 
    createJournalEntry, 
    updateJournalEntry, 
    deleteJournalEntry, 
    getAllJournals, 
    getJournalsByGroup, 
    getJournalsByUser, 
    getJournalById 
};