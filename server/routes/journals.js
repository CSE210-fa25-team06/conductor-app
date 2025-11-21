/**
 * Journal Routes - Defines API endpoints for journal entries
 */

const express = require("express");
const { createJournal, getUserJournals } = require("../controllers/journalController");

const router = express.Router();

// POST /journals/create - Create a new journal entry
router.post("/create", createJournal);

// GET /journals/user - Get all journal entries for the current user
// Optional query param: ?user_id=123 (otherwise uses session)
router.get("/user", getUserJournals);

module.exports = router;