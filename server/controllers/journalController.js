const { 
  createJournalEntry, 
  updateJournalEntry, 
  deleteJournalEntry, 
  getAllJournals,
  getJournalsByGroup, 
  getJournalsByUser,
  getJournalById 
} = require("../models/journalModel");

// Adjust path to point to your existing permissions.js file
const PERMISSIONS = require("../config/permissions/permissions");

const getJournals = async (req, res) => {
  try {
    const user = req.currentUser; 
    let rows = [];

    if (user.permissions.includes(PERMISSIONS.VIEW_ALL_JOURNALS)) {
      rows = await getAllJournals();
    } 
    else if (user.permissions.includes(PERMISSIONS.VIEW_OWN_GROUP_JOURNALS)) {
      rows = user.group_id 
        ? await getJournalsByGroup(user.group_id) 
        : await getJournalsByUser(user.id);
    } 
    else {
      rows = await getJournalsByUser(user.id);
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching journals:", err);
    res.status(500).json({ success: false, message: "Failed to load journals" });
  }
};

const createJournal = async (req, res) => {
  try {
    const { did, doing_next, blockers } = req.body;
    const user = req.currentUser;

    if (!did || !doing_next) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    if (!user.permissions.includes(PERMISSIONS.USER_SUBMIT_JOURNAL)) {
        return res.status(403).json({ success: false, message: "Unauthorized to submit journals." });
    }

    const journalEntry = await createJournalEntry({
      user_id: user.id,
      group_id: user.group_id || 1,
      entry_date: new Date().toISOString().split('T')[0],
      did,
      doing_next,
      blockers: blockers || null
    });

    res.status(201).json({ success: true, message: "Created successfully", data: journalEntry });
  } catch (error) {
    console.error("Error creating journal:", error);
    res.status(500).json({ success: false, message: "Failed to create journal" });
  }
};

const updateJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.currentUser;
    const { did, doing_next, blockers } = req.body;

    const existingEntry = await getJournalById(id);
    if (!existingEntry) return res.status(404).json({ success: false, message: "Entry not found" });

    const isOwner = existingEntry.user_id === user.id;
    const canEditAll = user.permissions.includes(PERMISSIONS.EDIT_ALL_JOURNALS);

    if (!isOwner && !canEditAll) {
        return res.status(403).json({ success: false, message: "Unauthorized to edit this entry." });
    }

    const updated = await updateJournalEntry({ id, did, doing_next, blockers });
    res.json({ success: true, message: "Updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating journal:", error);
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

const deleteJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.currentUser;

    const existingEntry = await getJournalById(id);
    if (!existingEntry) return res.status(404).json({ success: false, message: "Entry not found" });

    const isOwner = existingEntry.user_id === user.id;
    const canEditAll = user.permissions.includes(PERMISSIONS.EDIT_ALL_JOURNALS);

    if (!isOwner && !canEditAll) {
        return res.status(403).json({ success: false, message: "Unauthorized to delete this entry." });
    }

    await deleteJournalEntry(id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting journal:", error);
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
};

module.exports = { createJournal, updateJournal, deleteJournal, getJournals };