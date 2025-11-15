/*
  This file contains controller functions for handling user-related requests.
  It communicates with the service for searching the directory and returns users that match the query.
*/
import { searchDirectory } from "../service/search.js";

// ACCEPTS GET REQUESTS

/*
  EXAMPLE: GET http://localhost:3000/users?query=alice
*/

export const getUsers = async (req, res) => {
  const raw = req.query.query ?? "";
  const query = String(raw).trim(); // safe default

  const users = await searchDirectory(query);
  return res.status(200).json({ users });
};