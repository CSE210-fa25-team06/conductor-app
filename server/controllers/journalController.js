/**
 * Journal Controller - Handles HTTP requests for journal entries
 */

const { createJournalEntry, updateJournalEntry, deleteJournalEntry, getAllJournals } = require("../models/journalModel");

const getJournals = async (req, res) => {
  try {
    const rows = await getAllJournals();
    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error("Error fetching journals:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load journals"
    });
  }
};

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

const updateJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const { did, doing_next, blockers } = req.body;

    if (!id || !did || !doing_next) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: id, did, doing_next",
      });
    }

    const updated = await updateJournalEntry({
      id,
      did,
      doing_next,
      blockers: blockers || null,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Journal entry updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating journal entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update journal entry",
      error: error.message,
    });
  }
};

const deleteJournal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Missing journal ID",
      });
    }

    const result = await deleteJournalEntry(id);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Journal entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete journal entry",
      error: error.message,
    });
  }
};

module.exports = { createJournal, updateJournal, deleteJournal, getJournals };
