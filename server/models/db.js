/*
  This file establishes a connection to the PostgreSQL database using the pg library.
  It exports a connection pool used by other model files for database operations.
*/

import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pkg;

const {
  PGUSER = "postgres",
  PGHOST = "localhost",
  PGDATABASE = "conductor_app_db",
  PGPASSWORD = "password",
  PGPORT = "5432",
  DATABASE_URL,
} = process.env;

export const pool = new Pool(
  DATABASE_URL
    ? {
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
      }
    : {
        user: PGUSER,
        host: PGHOST,
        database: PGDATABASE,
        password: PGPASSWORD,
        port: Number(PGPORT),
      }
);
