/**
 * Journal Routes - Defines API endpoints for journal entries
 */

const express = require("express");
const { createJournal, updateJournal } = require("../controllers/journalController");

const router = express.Router();

// POST /journal/create - Create a new journal entry
router.post("/create", createJournal);

// PUT /journals/:id - Update an existing journal entry
router.put("/:id", updateJournal);

module.exports = router;