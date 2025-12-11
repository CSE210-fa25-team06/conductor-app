/**
 * Sentiment Routes - Defines API endpoints for sentiment entries
 */

const express = require("express");
const { createSentiment, getUserSentiments, updateSentiment, deleteSentiment } = require("../controllers/sentimentController");
const { loadUserContext } = require('../middleware/user-context');

const router = express.Router();
router.use(loadUserContext);

router.post("/create", 
    /** 
     *  @swagger
     *  #swagger.tags = ['Sentiments']
     *  #swagger.summary = 'Create a sentiment entry'
     *  #swagger.description = 'Creates a new sentiment entry for the current user.'
     *  #swagger.responses[200] = { description: "Sentiment created successfully" }
     */
    createSentiment
);

router.get("/user", 
    /** 
     *  @swagger
     *  #swagger.tags = ['Sentiments']
     *  #swagger.summary = 'Get user sentiment entries'
     *  #swagger.description = 'Returns all sentiment entries for the current user. Optionally accepts ?user_id=123 to override the session user.'
     *  #swagger.responses[200] = { description: "List of user sentiments returned successfully" }
     */
    getUserSentiments
);


router.put("/:id", 
    /** 
     *  @swagger
     *  #swagger.tags = ['Sentiments']
     *  #swagger.summary = 'Update a sentiment entry'
     *  #swagger.description = 'Updates an existing sentiment entry by its ID.'
     *  #swagger.responses[200] = { description: "Sentiment updated successfully" }
     *  #swagger.responses[404] = { description: "Sentiment not found" }
     */
    updateSentiment
);

router.delete("/:id", 
    /** 
     *  @swagger
     *  #swagger.tags = ['Sentiments']
     *  #swagger.summary = 'Delete a sentiment entry'
     *  #swagger.description = 'Deletes a sentiment entry by its ID.'
     *  #swagger.responses[200] = { description: "Sentiment deleted successfully" }
     *  #swagger.responses[404] = { description: "Sentiment not found" }
     */
    deleteSentiment
);

module.exports = router;
