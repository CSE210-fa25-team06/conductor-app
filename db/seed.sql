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
INSERT INTO roles (id, name, description, permissions)
VALUES
(1, 'Student', 'Standard student role', '{"can_submit_journal": true}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (id, name, description, permissions)
VALUES
(2, 'Team Lead', 'Student who leads a team', '{"can_view_group_data": true}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (id, name, description, permissions)
VALUES
(3, 'Tutor', 'Provides tutoring and support', '{"can_view_student_progress": true}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (id, name, description, permissions)
VALUES
(4, 'Teaching Assistant', 'Grades assignments and answers questions', '{"can_grade_assignments": true, "can_manage_attendance": true}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO roles (id, name, description, permissions)
VALUES
(5, 'Instructor', 'Teaches class', '{"can_manage_all": true, "can_create_roles": true}')
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
(103, 2, 'Charlie', 'charlie@example.com', 'url/charlie.png', '555-3333', '{"Thu": "2-4"}')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO users (id, group_id, name, email, photo_url, contact_info, availability)
VALUES
(104, NULL, 'David', 'david@example.com', 'url/david.png', '555-4444', '{"Fri": "11-1"}')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;


-- =========================================================================
-- 4. USER_ROLES (Assigning the Many-to-Many Roles)
-- =========================================================================
INSERT INTO user_roles (user_id, role_id)
VALUES
(100, 5), -- Instructor Ian -> Instructor
(101, 1), -- Alice -> Student
(102, 1), -- Bob -> Student
(102, 2), -- Bob -> Team Lead (M:N relationship)
(103, 1), -- Charlie -> Student
(104, 3), -- David -> Tutor
(104, 4)  -- David -> TA (M:N relationship)
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 5. ACTIVITY TYPES (Events that can be logged)
-- =========================================================================
INSERT INTO activity (id, activity_type, name, content)
VALUES
(1, 'AUTH', 'USER_LOGIN_SUCCESS', '{"description": "User successfully logged in."}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO activity (id, activity_type, name, content)
VALUES
(2, 'DATA', 'JOURNAL_SUBMITTED', '{"description": "User submitted weekly journal."}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =========================================================================
-- 6. ACTIVITY LOG (Sample Entries for Auditing)
-- =========================================================================
-- Ian logs in, Bob submits a journal
INSERT INTO activity_log (user_id, group_id, activity_id, content)
VALUES
(100, 1, 1, '{"ip_address": "192.168.1.1"}');

INSERT INTO activity_log (user_id, group_id, activity_id, content)
VALUES
(102, 1, 2, '{"journal_id": 1}');

-- =========================================================================
-- 7. USER_AUTH (Mock Auth.js Sessions/Credentials)
-- =========================================================================
INSERT INTO user_auth (user_id, provider, email, access_token, refresh_token)
VALUES
(100, 'google', 'ian@example.com', 'mock-access-token-ian', 'mock-refresh-token-ian');

INSERT INTO user_auth (user_id, provider, email, access_token, refresh_token)
VALUES
(101, 'github', 'alice@example.com', 'mock-access-token-alice', 'mock-refresh-token-alice');

-- =========================================================================
-- 8. ATTENDANCE (Sample Records)
-- =========================================================================
-- Recorded by David (104), the TA
INSERT INTO attendance (user_id, group_id, date, status, recorded_by, meeting_type, is_excused)
VALUES
(101, 1, '2025-11-01', 'Present', 104, 'Standup', FALSE);

INSERT INTO attendance (user_id, group_id, date, status, recorded_by, meeting_type, is_excused, reason)
VALUES
(103, 2, '2025-11-01', 'Absent', 104, 'Lecture', TRUE, 'Doctor appointment');

-- =========================================================================
-- 9. JOURNALS (Sample Entry from Bob)
-- =========================================================================
INSERT INTO journals (id, user_id, group_id, entry_date, did, doing_next, blockers)
VALUES
(1, 102, 1, '2025-10-30', 'Completed API design for users table.', 'Start coding login route.', 'Waiting for final DB credentials.');

-- =========================================================================
-- 10. MESSAGE THREADS (Conversations)
-- =========================================================================
INSERT INTO message_threads (id, user1_id, user2_id)
VALUES
(1, 101, 102)
ON CONFLICT (id) DO UPDATE SET user1_id = EXCLUDED.user1_id;

-- =========================================================================
-- 11. MESSAGES (Content for Thread 1)
-- =========================================================================
-- Alice sends the first message
INSERT INTO messages (thread_id, sender_id, receiver_id, content, subject)
VALUES
(1, 101, 102, 'Did you complete the schema review?', 'Schema Question');

-- Bob replies
INSERT INTO messages (thread_id, sender_id, receiver_id, content, subject)
VALUES
(1, 102, 101, 'Yes, it looks good. Just ran the script successfully.', 'Schema Question');

-- =========================================================================
-- 12. RESET SEQUENCES (Ensures programmatic inserts start after seed data IDs)
-- =========================================================================
SELECT SETVAL('groups_id_seq', (SELECT MAX(id) FROM groups));
SELECT SETVAL('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT SETVAL('users_id_seq', (SELECT MAX(id) FROM users));
SELECT SETVAL('activity_id_seq', (SELECT MAX(id) FROM activity));
SELECT SETVAL('user_auth_id_seq', (SELECT MAX(id) FROM user_auth));
SELECT SETVAL('journals_id_seq', (SELECT MAX(id) FROM journals));
SELECT SETVAL('message_threads_id_seq', (SELECT MAX(id) FROM message_threads));