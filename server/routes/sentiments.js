/**
 * Sentiment Routes - Defines API endpoints for sentiment entries
 */

const express = require("express");
const { createSentiment, getUserSentiments, updateSentiment, deleteSentiment } = require("../controllers/sentimentController");
const { loadUserContext } = require('../middleware/user-context');

const router = express.Router();
router.use(loadUserContext);

// POST /sentiments/create - Create a new sentiment entry
router.post("/create", createSentiment);

// GET /sentiments/user - Get all sentiment entries for the current user
// Optional query param: ?user_id=123 (otherwise uses session)
router.get("/user", getUserSentiments);

// PUT /sentiments/:id - Update an existing sentiment entry
router.put('/:id', updateSentiment);

// DELETE /sentiments/:id - Delete a sentiment entry
router.delete('/:id', deleteSentiment);

module.exports = router;
