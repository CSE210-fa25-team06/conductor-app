/*
  This file establishes a connection to the PostgreSQL database using the pg library.
  It exports a connection pool used by other model files for database operations.
*/

import pkg from "pg";
import dotenv from "dotenv";
dotenv.config()
const { Pool } = pkg;

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'conductor_app_db',
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
});
