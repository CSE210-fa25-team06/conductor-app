--
-- File: db/schema.sql
-- Description: Defines the PostgreSQL database schema for the Conductor app.
-- Creates all tables and establishes relational integrity via Foreign Keys.
-- Last updated: 11-04-2025
-- To run: psql -U postgres -d conductor_app_db -f db/schema.sql
--

-- =========================================================================
-- DEVELOPMENT CLEANUP (FOR DEBUGGING PURPOSES ONLY. REMOVE BEFORE DEPLOYING.)
-- =========================================================================
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_threads CASCADE;
DROP TABLE IF EXISTS journals CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS user_auth CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS activity CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- =========================================================================
-- CORE ENTITIES (PARENTS)
-- =========================================================================

-- Table: groups
-- Stores information about student teams.
CREATE TABLE groups (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) UNIQUE NOT NULL,
    logo_url      TEXT,
    slack_link    TEXT,
    repo_link     TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: roles
-- Defines application roles for Role-Based Access Control (RBAC).
CREATE TABLE roles (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(50) UNIQUE NOT NULL,
    description   TEXT,
    is_default    BOOLEAN NOT NULL DEFAULT FALSE,
    privilege_level INT NOT NULL DEFAULT 1, -- NEW: The hierarchy level for custom RBAC logic
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'MANAGE_USERS', 'VIEW_JOURNALS'
    description   TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: role_permissions
-- Join table for Many-to-Many relationship between roles and permissions.
CREATE TABLE role_permissions (
    role_id       INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Table: users
-- Core user table. Group assignment is optional (NULL).
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    group_id      INT REFERENCES groups(id) ON DELETE SET NULL, -- If a group is deleted, set user's group_id to NULL.
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    photo_url     TEXT,
    contact_info  TEXT,
    availability  JSONB, -- Stores user's available times
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_roles (Many-to-Many Join Table)
-- Associates users with one or more roles.
CREATE TABLE user_roles (
    user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- If user is deleted, remove their role assignments.
    role_id       INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE, -- If role is deleted, remove assignments.
    PRIMARY KEY (user_id, role_id) -- Composite key ensures a user only has a role once.
);

-- Table: activity
-- Defines possible actions (types) that can be logged (e.g., USER_LOGIN_SUCCESS).
CREATE TABLE activity (
    id             SERIAL PRIMARY KEY,
    activity_type  VARCHAR(50) NOT NULL, -- Category (e.g., 'AUTH', 'DATA', 'SYSTEM')
    name           VARCHAR(50) NOT NULL, -- Unique identifier for the event
    content        JSONB NOT NULL DEFAULT '{}'
);

-- =========================================================================
-- LOGGING AND AUTHENTICATION
-- =========================================================================

-- Table: activity_log
-- Records every auditable event in the system.
CREATE TABLE activity_log (
    id             SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id       INT REFERENCES groups(id) ON DELETE SET NULL,
    activity_id    INT NOT NULL REFERENCES activity(id) ON DELETE CASCADE,
    content        JSONB NOT NULL DEFAULT '{}', -- Stores event-specific data (e.g., IP address, journal ID)
    timestamp      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_auth
-- Stores credentials and tokens for external authentication providers (e.g., Google OAuth).
CREATE TABLE user_auth (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    access_token    TEXT NOT NULL,
    refresh_token   TEXT NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- APPLICATION DATA
-- =========================================================================

-- Table: attendance
-- Tracks student attendance for meetings and lectures.

CREATE TABLE attendance_sessions(
    id SERIAL PRIMARY KEY,
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_code VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE attendance (
    id             SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id       INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    session_id     VARCHAR(255) REFERENCES attendance_sessions(session_code),
    date           DATE NOT NULL,
    status         VARCHAR(50) NOT NULL, -- e.g., 'Present', 'Absent', 'Late'
    recorded_by    INT REFERENCES users(id), -- Self-referencing FK to record which user took attendance
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_excused     BOOLEAN NOT NULL DEFAULT FALSE,
    reason         TEXT,
    meeting_type   VARCHAR(50) NOT NULL, -- e.g., 'Standup', 'Lecture'
    UNIQUE (user_id, session_id)
);

-- Table: journals
-- Stores weekly student journal submissions.
CREATE TABLE journals (
    id            SERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id      INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    entry_date    DATE NOT NULL,
    did           TEXT NOT NULL,
    doing_next    TEXT NOT NULL,
    blockers      TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edited_at     TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_journals_user_id ON journals(user_id)

-- Optimizes SQL queries for retrieving journals based on the associated user_id (very common condition on this query in the app's logic)

-- Table: message_threads
-- Parent table for organizing conversations between users.
CREATE TABLE message_threads (
    id           SERIAL PRIMARY KEY,
    user1_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user1_id, user2_id), -- Ensures only one thread exists between any two users
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: messages
-- Individual messages belonging to a thread.
CREATE TABLE messages (
    id           SERIAL PRIMARY KEY,
    sender_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id  INT REFERENCES users(id) ON DELETE SET NULL,
    subject      TEXT,
    content      TEXT NOT NULL,
    sent_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thread_id    INT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE -- Links message to its thread
);

-- sentiments table for emotional tracking
CREATE TABLE IF NOT EXISTS sentiments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('happy', 'neutral', 'sad')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Helpful index for querying a user's sentiments by recency
CREATE INDEX IF NOT EXISTS sentiments_user_created_idx
  ON sentiments (user_id, created_at DESC);
