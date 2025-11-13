/**
 * Journal Controller - Handles HTTP requests for journal entries
 */

import { createJournalEntry } from "../models/journalModel.js";

/**
 * Create a new journal entry
 * POST /journal/create
 */
export const createJournal = async (req, res) => {
  try {
    const { user_id, group_id, entry_date, did, doing_next, blockers } = req.body;

    // Validate required fields
    if (!user_id || !group_id || !entry_date || !did || !doing_next) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: user_id, group_id, entry_date, did, doing_next"
      });
    }

    // Create journal entry
    const journalEntry = await createJournalEntry({
      user_id,
      group_id,
      entry_date,
      did,
      doing_next,
      blockers: blockers || null
    });

    // Return success response
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
