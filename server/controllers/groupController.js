/*
  This file contains controller functions for handling group-related requests.
  It processes input from the routes and retrieves data using the groupModel.
*/

const { getAllGroups } = require("../models/groupModel");

async function getGroups(req, res) {
  try {
    const groups = await getAllGroups();
    res.json({ groups });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ error: "Failed to load groups" });
  }
}

module.exports = { getGroups };
