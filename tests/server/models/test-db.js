const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../', '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.SERVER_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testDB() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Database connection OK:", res.rows[0]);
  } catch (err) {
    console.error("❌ Database connection FAILED:", err.message);
  } finally {
    await pool.end();
  }
}

testDB();