/*
  This file establishes a connection to the PostgreSQL database using the pg library.
  It exports a connection pool used by other model files for database operations.
*/

import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
