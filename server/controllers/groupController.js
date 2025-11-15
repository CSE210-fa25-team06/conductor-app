/*
  This file contains controller functions for handling group-related requests.
  It processes input from the routes and retrieves data using the groupModel.
*/

function getGroups(req, res) {
  res.json({ message: "List of groups" });
}

module.exports = { getGroups };