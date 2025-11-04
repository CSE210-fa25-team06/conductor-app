-- 
-- This file defines the PostgreSQL database schema for the Conductor app.
-- It creates all necessary tables and their relationships.
--

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL
);

CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);
