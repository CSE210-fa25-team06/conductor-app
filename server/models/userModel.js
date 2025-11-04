/*
  This file contains all PostgreSQL queries related to user data.
  It provides functions for retrieving, inserting, and updating user records.
*/

import { pool } from "./db.js";

export async function getAllUsers() {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
}
