/*
  This file contains controller functions for handling user-related requests.
  It communicates with the service for searching the directory and returns users that match the query.
*/

const { searchDirectory } = require("../service/search");

async function getUsers(req, res) {
  try {
    const raw = req.query.query ?? "";
    const query = String(raw).trim();

    const users = await searchDirectory(query);
    return res.status(200).json({ users });
  } catch (err) {
    console.error("Error in getUsers:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
}

module.exports = { getUsers };
