/**
 * Journal Routes - Defines API endpoints for journal entries
 */

const express = require("express");
const { createJournal } = require("../controllers/journalController");

const router = express.Router();

// POST /journal/create - Create a new journal entry
router.post("/create", createJournal);

module.exports = router;