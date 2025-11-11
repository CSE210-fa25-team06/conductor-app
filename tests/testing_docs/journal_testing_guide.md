# Journal API Testing Guide

## Overview
This guide explains how to test the Journal API that was implemented for the Conductor application.

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

## Test Scripts

### 1. Simple Test Script (`test-direct .js`)
A basic test script that validates the core functionality:

```bash
npm run test:direct 
```

This script tests:
- ✅ Creating a valid journal entry
- ✅ Handling missing required fields (400 error)
- ✅ Server connection verification

### 2. Comprehensive Test Script (`test-journal.js`)
A more detailed test script with multiple scenarios:

```bash
npm run test:journal 
```

This script tests:
- ✅ Normal journal creation with all fields
- ✅ Missing required fields validation
- ✅ Optional blockers field (can be omitted)
