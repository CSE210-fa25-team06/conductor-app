/**
 * Sentiment Controller - Handles HTTP requests for sentiment entries
 */

const { createSentimentEntry, getSentimentsByUserId, getSentimentById, updateSentimentEntry, deleteSentimentEntry } = require("../models/sentimentModel");
const PERMISSIONS = require("../config/permissions/permissions");

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

/**
 * Update a sentiment entry
 */
const updateSentiment = async (req, res) => {
  try {
    const { id } = req.params;
    const { sentiment, comment } = req.body;
    const user = req.currentUser;

    const existing = await getSentimentById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Entry not found" });

    const isOwner = existing.user_id === user.id;
    const canEditAll = user.permissions && user.permissions.includes(PERMISSIONS.EDIT_ALL_JOURNALS);
    if (!isOwner && !canEditAll) return res.status(403).json({ success: false, message: "Unauthorized to edit this entry." });

    const validSentiments = ['happy', 'neutral', 'sad'];
    if (!validSentiments.includes(sentiment)) {
      return res.status(400).json({ success: false, message: "Invalid sentiment value" });
    }

    const updated = await updateSentimentEntry({ id, sentiment, comment });
    res.json({ success: true, message: "Updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating sentiment:", error);
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

/**
 * Delete a sentiment entry
 */
const deleteSentiment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.currentUser;
    const existing = await getSentimentById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Entry not found" });

    const isOwner = existing.user_id === user.id;
    const canEditAll = user.permissions && user.permissions.includes(PERMISSIONS.EDIT_ALL_JOURNALS);
    if (!isOwner && !canEditAll) return res.status(403).json({ success: false, message: "Unauthorized to delete this entry." });

    await deleteSentimentEntry(id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting sentiment:", error);
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
};

module.exports.updateSentiment = updateSentiment;
module.exports.deleteSentiment = deleteSentiment;
