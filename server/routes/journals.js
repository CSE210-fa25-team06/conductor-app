/**
 * Journal Routes - Defines API endpoints for journal entries
 */

const express = require("express");
const { createJournal } = require("../controllers/journalController");

const router = express.Router();

router.post("/create", (req, res) => {
    /**
        #swagger.summary = 'Create a journal entry'
        #swagger.description = 'Creates a new journal entry.'
        #swagger.parameters['body'] = {
                in: 'body',
                description: 'Journal payload',
                schema: {
                    $text: "Today was good",
                    $user_id: 1
                }
        }
        #swagger.responses[201] = { description: "Journal created" }
    */
    createJournal(req, res);
});

module.exports = router;