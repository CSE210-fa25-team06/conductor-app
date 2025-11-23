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
DATABASE_URL=postgres://postgres:YourPassword@localhost:5432/conductor_app_db
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

### 2. Simple Functionality Test Script (`test-simple_attendance.js`)
A more detailed test script with multiple scenarios:

```bash
npm run test-simple_attendance
```

This script tests:
- ✅ Marking student attendance
- ✅ Grabbing student information from directory
- ✅ Pulling single student attendance record
- ✅ Pulling attendance records based on date

### 3. Comphrensive Functionality Test Script (`test-attendance.js`)
A more detailed test script with multiple scenarios:

```bash
npm run test-attendance
```

This script tests:
- ✅ Marking student attendance
- ✅ Missing fields (should trigger an error)
- ✅ Optional fields (should work without any issues)