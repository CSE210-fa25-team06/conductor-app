--
-- File: db/seed.sql
-- Description: Populates the Conductor database with sample data for development and testing.
-- Establishes groups, roles, users, and all relational data.
-- Last updated: 11-04-2025
-- To run: psql -U postgres -d conductor_app_db -f db/seed.sql
--

-- =========================================================================
-- 1. GROUPS (Teams/Cohorts)
-- =========================================================================

INSERT INTO groups (id, name, logo_url, slack_link, repo_link)
VALUES
(1, 'Group Alpha', 'url/alpha.png', 'slack/alpha', 'github/alpha')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO groups (id, name, logo_url, slack_link, repo_link)
VALUES
(2, 'Group Beta', 'url/beta.png', 'slack/beta', 'github/beta')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =========================================================================
-- 2. ROLES (Least to Most Privileged)
-- =========================================================================
-- Permissions are placeholder JSONB objects, independent of the role name.

INSERT INTO roles (id, name, description, privilege_level, is_default)
VALUES
(1, 'Student', 'Standard student role', 1, TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (id, name, description, privilege_level, is_default)
VALUES
(2, 'Team Lead', 'Student who leads a team', 1, FALSE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (id, name, description, privilege_level, is_default)
VALUES
(3, 'Tutor', 'Provides tutoring and support', 5, FALSE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (id, name, description, privilege_level, is_default)
VALUES
(4, 'Teaching Assistant', 'Provides tutoring and support', 10, FALSE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (id, name, description, privilege_level, is_default)
VALUES
(5, 'Instructor', 'Teaches class', 50, FALSE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =========================================================================
-- 3. USERS (ID starts at 100 for easy identification)
-- =========================================================================
INSERT INTO users (id, group_id, name, email, photo_url, contact_info, availability)
VALUES
(100, 1, 'Instructor Ian', 'ian@example.com', 'url/ian.png', '555-0000', '{"Mon": "9-5"}')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO users (id, group_id, name, email, photo_url, contact_info, availability)
VALUES
(101, 1, 'Alice', 'alice@example.com', 'url/alice.png', '555-1111', '{"Tue": "10-12"}')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO users (id, group_id, name, email, photo_url, contact_info, availability)
VALUES
(102, 1, 'Bob', 'bob@example.com', 'url/bob.png', '555-2222', '{"Wed": "1-3"}')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO users (id, group_id, name, email, photo_url, contact_info, availability)
VALUES
(103, 2, 'Charlie', 'charlie@example.com', 'url/charlie.png', '555-3333', '{"Thu": "2-4"}') -- FIXED
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO users (id, group_id, name, email, photo_url, contact_info, availability)
VALUES
(104, NULL, 'David', 'david@example.com', 'url/david.png', '555-4444', '{"Fri": "11-1"}')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- =========================================================================
-- 4. PERMISSIONS (Master list of all system capabilities)
-- =========================================================================
-- FIX: Added ON CONFLICT to avoid duplicate key errors on rerun.
INSERT INTO permissions (id, name, description)
VALUES
(1001, 'USER_SUBMIT_JOURNAL', 'Allows a user to create and submit their weekly journal entry.'),
(1002, 'VIEW_OWN_GROUP_JOURNALS', 'Allows viewing journal entries of members within the assigned group.'),
(1003, 'GROUP_MANAGE_ATTENDANCE', 'Allows marking attendance (e.g., stand-up check-ins) for members within the group.'),
(1004, 'VIEW_ALL_JOURNALS', 'Allows viewing all journal entries across the entire system.'),
(1005, 'MANAGE_ALL_ATTENDANCE', 'Allows viewing and editing attendance for all users across the system.'),
(1006, 'ASSIGN_ROLES', 'Allows assigning or modifying user roles.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =========================================================================
-- 5. ROLE_PERMISSIONS (Linking Roles to Permissions - Default Associations)
-- =========================================================================
-- FIX: Added ON CONFLICT DO NOTHING to prevent duplicate key errors on rerun.

-- Student (ID 1) Permissions:
INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 1001) ON CONFLICT DO NOTHING;

-- Group Leader (ID 2) Permissions:
INSERT INTO role_permissions (role_id, permission_id) VALUES (2, 1002) ON CONFLICT DO NOTHING; -- VIEW_OWN_GROUP_JOURNALS
INSERT INTO role_permissions (role_id, permission_id) VALUES (2, 1003) ON CONFLICT DO NOTHING; -- GROUP_MANAGE_ATTENDANCE (NEW FEATURE)

-- Tutor (ID 3) Permissions:
INSERT INTO role_permissions (role_id, permission_id) VALUES (3, 1002) ON CONFLICT DO NOTHING; -- VIEW_OWN_GROUP_JOURNALS

-- Teaching Assistant (ID 4) Permissions:
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 1004) ON CONFLICT DO NOTHING; -- VIEW_ALL_JOURNALS
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 1005) ON CONFLICT DO NOTHING; -- MANAGE_ALL_ATTENDANCE

-- Professor (ID 5) Permissions: (Gets ALL Admin Permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES (5, 1004) ON CONFLICT DO NOTHING; -- VIEW_ALL_JOURNALS
INSERT INTO role_permissions (role_id, permission_id) VALUES (5, 1005) ON CONFLICT DO NOTHING; -- MANAGE_ALL_ATTENDANCE
INSERT INTO role_permissions (role_id, permission_id) VALUES (5, 1006) ON CONFLICT DO NOTHING; -- ASSIGN_ROLES

-- =========================================================================
-- 6. USER_ROLES (Assigning the Many-to-Many Roles)
-- =========================================================================
-- FIX: Added ON CONFLICT DO NOTHING to prevent duplicate key errors on rerun.
INSERT INTO user_roles (user_id, role_id)
VALUES
(100, 5), -- Instructor Ian -> Instructor
(101, 1), -- Alice -> Student
(102, 1), -- Bob -> Student
(102, 2), -- Bob -> Team Lead (M:N relationship)
(103, 1), -- Charlie -> Student (FIXED user_id 103 is now created)
(104, 3), -- David -> Tutor
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 7. AUTHENTICATION (Linking Test Accounts to an Auth Provider)
-- =========================================================================
-- FIX: Added ON CONFLICT (email) DO UPDATE SET to avoid unique constraint violations on rerun.
INSERT INTO user_auth (user_id, provider, email, access_token, refresh_token)
VALUES
    (101, 'mock', 'alice@example.com', 'dummy-token-101', 'dummy-refresh-101'),
    (102, 'mock', 'bob@example.com', 'dummy-token-102', 'dummy-refresh-102'),
    (103, 'mock', 'charlie@example.com', 'dummy-token-103', 'dummy-refresh-103'), -- FIXED user_id 103 now exists
    (104, 'mock', 'david@example.com', 'dummy-token-104', 'dummy-refresh-104')
ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id;

-- =========================================================================
-- 9. DUMMY DATA: ACTIVITY
-- =========================================================================
INSERT INTO activity (id, name, activity_type)
VALUES
(1, 'Standup Meeting', 'Standup')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =========================================================================
-- 10. ACTIVITY TYPES (Events that can be logged)
-- =========================================================================
-- FIX: Added ON CONFLICT DO UPDATE SET to avoid duplicate key errors on rerun.
INSERT INTO activity (id, activity_type, name, content)
VALUES
(1, 'AUTH', 'USER_LOGIN_SUCCESS', '{"description": "User successfully logged in."}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO activity (id, activity_type, name, content)
VALUES
(2, 'DATA', 'JOURNAL_SUBMITTED', '{"description": "User submitted weekly journal."}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =========================================================================
-- 11. ACTIVITY LOG (Sample Entries for Auditing)
-- =========================================================================

-- Ian logs in, Bob submits a journal
INSERT INTO activity_log (user_id, group_id, activity_id, content)
VALUES
(100, 1, 1, '{"ip_address": "192.168.1.1"}');

INSERT INTO activity_log (user_id, group_id, activity_id, content)
VALUES
(102, 1, 2, '{"journal_id": 1}');

-- =========================================================================
-- 12. ATTENDANCE (Sample Records)
-- =========================================================================
-- FIX: Added ON CONFLICT (user_id, date) DO UPDATE SET to avoid unique constraint violations on rerun.
-- Recorded by David (104), the TA
INSERT INTO attendance (user_id, group_id, date, status, recorded_by, meeting_type, is_excused)
VALUES
(101, 1, '2025-11-01', 'Present', 104, 'Standup', FALSE)
ON CONFLICT (user_id, date) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO attendance (user_id, group_id, date, status, recorded_by, meeting_type, is_excused, reason)
VALUES
(103, 2, '2025-11-01', 'Absent', 104, 'Lecture', TRUE, 'Doctor appointment') -- FIXED user_id 103 now exists
ON CONFLICT (user_id, date) DO UPDATE SET status = EXCLUDED.status;

-- =========================================================================
-- 13. JOURNALS (Sample Entry from Bob)
-- =========================================================================
-- FIX: Added ON CONFLICT (id) DO UPDATE SET to avoid duplicate key errors on rerun.
INSERT INTO journals (id, user_id, group_id, entry_date, did, doing_next, blockers)
VALUES
(1, 102, 1, '2025-10-30', 'Completed API design for users table.', 'Start coding login route.', 'Waiting for final DB credentials.')
ON CONFLICT (id) DO UPDATE SET did = EXCLUDED.did;

-- =========================================================================
-- 14. MESSAGE THREADS (Conversations)
-- =========================================================================
-- FIX: Added ON CONFLICT (id) DO UPDATE SET to avoid duplicate key errors on rerun.
INSERT INTO message_threads (id, user1_id, user2_id)
VALUES
(1, 101, 102)
ON CONFLICT (id) DO UPDATE SET user1_id = EXCLUDED.user1_id;

-- =========================================================================
-- 15. MESSAGES (Content for Thread 1)
-- =========================================================================
-- Messages are generally unique time-series data, so no ON CONFLICT is necessary unless the IDs are manually seeded.

-- Alice sends the first message
INSERT INTO messages (thread_id, sender_id, receiver_id, content, subject)
VALUES
(1, 101, 102, 'Did you complete the schema review?', 'Schema Question');

-- Bob replies
INSERT INTO messages (thread_id, sender_id, receiver_id, content, subject)
VALUES
(1, 102, 101, 'Yes, it looks good. Just ran the script successfully.', 'Schema Question');

-- =========================================================================
-- 16. RESET SEQUENCES (Ensures programmatic inserts start after seed data IDs)
-- =========================================================================
SELECT SETVAL('groups_id_seq', (SELECT MAX(id) FROM groups));
SELECT SETVAL('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT SETVAL('permissions_id_seq', (SELECT MAX(id) FROM permissions));
SELECT SETVAL('users_id_seq', (SELECT MAX(id) FROM users));
SELECT SETVAL('activity_id_seq', (SELECT MAX(id) FROM activity));
SELECT SETVAL('user_auth_id_seq', (SELECT MAX(id) FROM user_auth));
SELECT SETVAL('journals_id_seq', (SELECT MAX(id) FROM journals));
SELECT SETVAL('message_threads_id_seq', (SELECT MAX(id) FROM message_threads));
SELECT SETVAL('messages_id_seq', (SELECT MAX(id) FROM messages));

-- ===============================================================
-- CLASS DIRECTORY SAMPLE USERS
-- ===============================================================

-- Ensure Team 6 exists
INSERT INTO groups (name)
VALUES ('Team 6')
ON CONFLICT (name) DO NOTHING;

-- Ensure Student role exists
INSERT INTO roles (name)
VALUES ('Student')
ON CONFLICT (name) DO NOTHING;

-- Adam
INSERT INTO users (name, email, contact_info, photo_url, availability, group_id)
VALUES (
  'Adam',
  'adam@example.com',
  'adam@example.com',
  'url/adam.png',
  '{"Mon": "9-5"}',
  (SELECT id FROM groups WHERE name='Team 6')
)
ON CONFLICT (email) DO NOTHING;

-- Alex
INSERT INTO users (name, email, contact_info, photo_url, availability, group_id)
VALUES (
  'Alex',
  'alex@example.com',
  'alex@example.com',
  'url/alex.png',
  '{"Mon": "9-5"}',
  (SELECT id FROM groups WHERE name='Team 6')
)
ON CONFLICT (email) DO NOTHING;

-- Akshay
INSERT INTO users (name, email, contact_info, photo_url, availability, group_id)
VALUES (
  'Akshay',
  'akshay.com',
  'akshay.com',
  'url/akshay.png',
  '{"Mon": "9-5"}',
  (SELECT id FROM groups WHERE name='Team 6')
)
ON CONFLICT (email) DO NOTHING;

-- Link them to the Student role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.name IN ('Adam', 'Alex', 'Akshay') AND r.name = 'Student';
