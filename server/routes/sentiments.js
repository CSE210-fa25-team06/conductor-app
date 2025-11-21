/**
 * Sentiment Routes - Defines API endpoints for sentiment entries
 */

const express = require("express");
const { createSentiment, getUserSentiments } = require("../controllers/sentimentController");

const router = express.Router();

// POST /sentiments/create - Create a new sentiment entry
router.post("/create", createSentiment);

// GET /sentiments/user - Get all sentiment entries for the current user
// Optional query param: ?user_id=123 (otherwise uses session)
router.get("/user", getUserSentiments);

module.exports = router;
