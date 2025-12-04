/**
 * Journal Routes - Defines API endpoints for journal entries
 */

const express = require("express");
const { createJournal, updateJournal, deleteJournal, getJournals, getUserJournals } = require("../controllers/journalController");
const { loadUserContext } = require('../middleware/user-context');

const router = express.Router();
router.use(loadUserContext);

// GET / - Grabs all the journals to load
router.get("/", getJournals);

// POST /journals/create - Create a new journal entry
router.post("/create", createJournal);

// GET /journals/user - Get all journal entries for the current user
// Optional query param: ?user_id=123 (otherwise uses session)
router.get("/user", getUserJournals);

// PUT /journals/:id - Update an existing journal entry
router.put("/:id", updateJournal);

// DELETE /journals/:id - Delete an existing journal entry
router.delete("/:id", deleteJournal);
module.exports = router;