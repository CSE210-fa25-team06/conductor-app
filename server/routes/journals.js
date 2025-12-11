/**
 * Journal Routes - Defines API endpoints for journal entries
 */

const express = require("express");
const { createJournal, updateJournal, deleteJournal, getJournals } = require("../controllers/journalController");
const { loadUserContext } = require('../middleware/user-context');

const router = express.Router();
// GET / - Grabs all the journals to load
router.use(loadUserContext);

router.get("/", 
    /** 
     *  @swagger
     *  #swagger.tags = ['Journals']
     *  #swagger.summary = 'Get all journals'
     *  #swagger.description = 'Returns a list of all journal entries.'
     *  #swagger.responses[200] = { description: "List of journals returned successfully" }
     */
    getJournals
);

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

router.put("/:id", 
    /** 
     *  @swagger
     *  #swagger.tags = ['Journals']
     *  #swagger.summary = 'Update a journal entry'
     *  #swagger.description = 'Updates an existing journal entry by its ID.'
     *  #swagger.responses[200] = { description: "Journal updated successfully" }
     *  #swagger.responses[404] = { description: "Journal not found" }
     */
    updateJournal
);

router.delete("/:id", 
    /** 
     *  @swagger
     *  #swagger.tags = ['Journals']
     *  #swagger.summary = 'Delete a journal entry'
     *  #swagger.description = 'Deletes an existing journal entry by its ID.'
     *  #swagger.responses[200] = { description: "Journal deleted successfully" }
     *  #swagger.responses[404] = { description: "Journal not found" }
     */
    deleteJournal
);
module.exports = router;
