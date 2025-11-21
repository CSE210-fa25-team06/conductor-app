/**
 * Sentiment Controller - Handles HTTP requests for sentiment entries
 */

const { createSentimentEntry, getSentimentsByUserId } = require("../models/sentimentModel");

/**
 * Create a new sentiment entry
 */
const createSentiment = async (req, res) => {
  try {
    const { user_id, group_id, sentiment, comment } = req.body;

    // Validate required fields
    if (!user_id || !group_id || !sentiment) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: user_id, group_id, sentiment"
      });
    }

    // Validate sentiment value
    const validSentiments = ['happy', 'neutral', 'sad'];
    if (!validSentiments.includes(sentiment)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sentiment value. Must be one of: happy, neutral, sad"
      });
    }

    const sentimentEntry = await createSentimentEntry({
      user_id,
      group_id,
      sentiment,
      comment: comment || null
    });

    res.status(201).json({
      success: true,
      message: "Sentiment entry created successfully",
      data: {
        id: sentimentEntry.id,
        user_id: sentimentEntry.user_id,
        group_id: sentimentEntry.group_id,
        sentiment: sentimentEntry.sentiment,
        comment: sentimentEntry.comment,
        created_at: sentimentEntry.created_at
      }
    });
  } catch (error) {
    console.error("Error creating sentiment entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create sentiment entry",
      error: error.message
    });
  }
};

/**
 * Get all sentiment entries for a user
 * Can use either user_id from query params or from session
 */
const getUserSentiments = async (req, res) => {
  try {
    // Get user_id from query params, or fall back to session
    let user_id = req.query.user_id || req.session.userId || req.user;
    
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    // Convert to number if it's a string
    user_id = parseInt(user_id, 10);
    
    if (isNaN(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user_id"
      });
    }
    
    const sentiments = await getSentimentsByUserId(user_id);
    
    res.status(200).json({
      success: true,
      count: sentiments.length,
      data: sentiments
    });
  } catch (error) {
    console.error("Error fetching user sentiments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sentiment entries",
      error: error.message
    });
  }
};

module.exports = { createSentiment, getUserSentiments };
