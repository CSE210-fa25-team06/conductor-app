/*
  This file contains controller functions for handling user-related requests.
  It communicates with the service for searching the directory and returns users that match the query.
*/

const { searchDirectory } = require("../services/search");

async function getUsers(req, res) {
  try {
    const raw = req.query.query ?? "";
    const query = String(raw).trim();
    const rawRole = req.query.role ?? "";
    const role = String(rawRole).trim() || null;
    const rawGroup = req.query.group ?? "";
    const group = String(rawGroup).trim() || null;
    const rawGroupId = req.query.groupId ?? "";
    const groupId = rawGroupId !== "" ? Number(rawGroupId) : null;

    const users = await searchDirectory(query, role, group, groupId);
    return res.status(200).json({ users });
  } catch (err) {
    console.error("Error in getUsers:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
}

module.exports = { getUsers };
