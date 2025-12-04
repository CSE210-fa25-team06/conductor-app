import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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