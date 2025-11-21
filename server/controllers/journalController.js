/**
 * Journal Controller - Handles HTTP requests for journal entries
 */

const { createJournalEntry, getJournalsByUserId } = require("../models/journalModel");

const createJournal = async (req, res) => {
  try {
    const { user_id, group_id, entry_date, did, doing_next, blockers } = req.body;

    if (!user_id || !group_id || !entry_date || !did || !doing_next) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: user_id, group_id, entry_date, did, doing_next"
      });
    }

    const journalEntry = await createJournalEntry({
      user_id,
      group_id,
      entry_date,
      did,
      doing_next,
      blockers: blockers || null
    });

    res.status(201).json({
      success: true,
      message: "Journal entry created successfully",
      data: {
        id: journalEntry.id,
        user_id: journalEntry.user_id,
        group_id: journalEntry.group_id,
        entry_date: journalEntry.entry_date,
        did: journalEntry.did,
        doing_next: journalEntry.doing_next,
        blockers: journalEntry.blockers,
        created_at: journalEntry.created_at
      }
    });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create journal entry",
      error: error.message
    });
  }
};

/**
 * Get all journal entries for a user
 * Can use either user_id from query params or from session
 */
const getUserJournals = async (req, res) => {
  try {
    // Get user_id from query params, or fall back to session
    let user_id = req.query.user_id || req.session.userId || req.user;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    // Convert to number if it's a string
    user_id = parseInt(user_id, 10);
    
    if (isNaN(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user_id"
      });
    }
    
    const journals = await getJournalsByUserId(user_id);
    
    res.status(200).json({
      success: true,
      count: journals.length,
      data: journals
    });
  } catch (error) {
    console.error("Error fetching user journals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch journal entries",
      error: error.message
    });
  }
};

module.exports = { createJournal, getUserJournals };
