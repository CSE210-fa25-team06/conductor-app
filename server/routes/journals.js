/**
 * Journal Routes - Defines API endpoints for journal entries
 */

const express = require("express");
const { createJournal, updateJournal, deleteJournal, getJournals } = require("../controllers/journalController");
const { loadUserContext } = require('../middleware/user-context');

const router = express.Router();
// GET / - Grabs all the journals to load
router.use(loadUserContext);

router.get("/", getJournals);

router.post("/create", (req, res) => {
    /** 
     *  @swagger
     *  #swagger.tags = ['Journals']
     *  #swagger.summary = 'Create a journal entry'
     *  #swagger.description = 'Creates a new journal entry.'
     *  #swagger.responses[200] = { description: "Journal created" }
    */
    createJournal(req, res);
});

// POST /journal/create - Create a new journal entry
router.post("/create", createJournal);

// PUT /journals/:id - Update an existing journal entry
router.put("/:id", updateJournal);

// DELETE /journals/:id - Delete an existing journal entry
router.delete("/:id", deleteJournal);
module.exports = router;
