/**
 * File: journal_spec.test.js
 * Description: Tests database integrity for journals and defines future spec tests for the evaluation journal feature.
 */

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/conductor_app_db'
})

describe('Evaluation Journal – Database and Spec Tests', () => {
  afterAll(async () => {
    await pool.end()
  })

  // --- DATABASE INTEGRITY TESTS ---

  test('journals table should exist', async () => {
    const res = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'journals'
      );
    `)
    expect(res.rows[0].exists).toBe(true)
  })

  test('journals table should contain required columns', async () => {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'journals';
    `)
    const columns = res.rows.map(r => r.column_name)
    expect(columns).toEqual(
      expect.arrayContaining(['id', 'user_id', 'group_id', 'did', 'doing_next', 'blockers'])
    )
  })

  test('seed data should contain at least one journal entry', async () => {
    const res = await pool.query(`SELECT COUNT(*) FROM journals;`)
    expect(parseInt(res.rows[0].count)).toBeGreaterThan(0)
  })

  test('deleting a user should remove their journal entries (ON DELETE CASCADE)', async () => {
    // insert a temporary user + journal
    const user = await pool.query(`INSERT INTO users (name, email) VALUES ('TempUser', 'temp@example.com') RETURNING id;`)
    const id = user.rows[0].id
    await pool.query(`INSERT INTO journals (user_id, group_id, entry_date, did, doing_next) VALUES (${id}, 1, NOW(), 'test', 'test');`)
    await pool.query(`DELETE FROM users WHERE id = ${id};`)
    const res = await pool.query(`SELECT * FROM journals WHERE user_id = ${id};`)
    expect(res.rowCount).toBe(0)
  })

  // --- SPEC PLACEHOLDER TESTS (to be implemented later) ---

  test.todo('should create a journal entry when POST /api/journals is called')
  test.todo('should reject invalid or empty journal entries')
  test.todo('should allow only the author to view their own journal entry')
})
