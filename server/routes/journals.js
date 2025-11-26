/**
 * Journal Routes - Defines API endpoints for journal entries
 */

const express = require("express");
const { createJournal } = require("../controllers/journalController");

const router = express.Router();

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

module.exports = router;