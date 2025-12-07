const { pool } = require("./db");

async function getAllGroups() {
  const result = await pool.query("SELECT * FROM groups");
  return result.rows;
}

module.exports = {
  getAllGroups
};

/*
  This file contains all PostgreSQL queries related to group data.
  It provides functions for managing group records and relationships.
*/

// const { pool } = require("./db");

// async function getAllGroups() {
//   const result = await pool.query(
//     "SELECT id, name, created_at FROM groups ORDER BY name"
//   );
//   return result.rows;
// }

// module.exports = {
//   getAllGroups
// };

import { pool } from "./db.js";

// export async function getAllGroups() {
//   const result = await pool.query("SELECT * FROM groups");
//   return result.rows;
// }