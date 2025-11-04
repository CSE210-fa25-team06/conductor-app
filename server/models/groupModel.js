/*
  This file contains all PostgreSQL queries related to group data.
  It provides functions for managing group records and relationships.
*/

import { pool } from "./db.js";

export async function getAllGroups() {
  const result = await pool.query("SELECT * FROM groups");
  return result.rows;
}
