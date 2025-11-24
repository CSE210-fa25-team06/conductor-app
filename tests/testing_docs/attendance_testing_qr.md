# Attendance API Testing Guide (Backend)

## Overview
This guide explains how to test the Attendance API that was implemented for our Conductor application.

## Prerequisites
- Node.js and npm installed
- PostgreSQL database set up with schema and seed data
- Server running on `http://localhost:3000`

## Setup
1. Install dependencies:
```bash
npm install
```

2. Set up database (if not already done):
```bash
psql -U postgres -d conductor_app_db -f db/schema.sql
psql -U postgres -d conductor_app_db -f db/seed.sql
```

3. Start the server:
```bash
npm start
```
4. Create a .env file:
```bash
touch .env
```
5. Store DATABASE_URL in there:
```bash
nano .env
```
Putting this in there:
```
PGUSER=postgres
PGHOST=localhost
PGDATABASE=conductor_app_db
PGPASSWORD= "Your Password Here"
PGPORT=5432
SESSION_SECRET = hhoighowihgkoewnkngouhwoghowiknkwengoi (can be any random super long string)
```

## Test Scripts

### 1. Database Test Script (`db_test.js`)
A basic test script that validates the database connection:

```bash
npm run test-db
```

This script tests:
- ✅ .env creation and it being read
- ✅ Database connection

### 2. Simple Functionality Test Script (`test-attendance-new.js`)

```bash
node tests/server/attendance/test-attendance-new.js
```

This script tests:
- ✅ Starting a session which returns session_id and QR code
- ✅ Updating a students attendance (simulating them scanning the code)
- ✅ Ending the session once lecture attendance has been taken


