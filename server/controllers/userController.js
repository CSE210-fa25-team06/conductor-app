/*
  This file contains controller functions for handling user-related requests.
  It communicates with the userModel to query and return data from the database.
*/

export const getUsers = (req, res) => {
  res.json({ message: "List of users" });
};
