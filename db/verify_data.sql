--
-- File: db/verify_data.sql
-- Purpose: Confirms successful loading of seed data and integrity of database relationships.
-- Last updated: 11-04-2025
-- To run: psql -U postgres -d conductor_app_db -f db/verify_data.sql
--

--------------------------------------------------------------------------------
-- 1. RBAC AND HIERARCHY VERIFICATION (USERS, ROLES, GROUPS)
--------------------------------------------------------------------------------

-- 1.1. Verify Multi-Role Assignment: Confirms users with multiple roles appear for all assigned roles.
SELECT
    u.name AS "User Name",
    r.name AS "Role Name"
FROM
    user_roles ur
JOIN
    users u ON ur.user_id = u.id
JOIN
    roles r ON ur.role_id = r.id
WHERE
    u.name IN ('Bob', 'David')
ORDER BY
    u.name, r.name;

-- 1.2. Verify Group Assignment: Confirms groups have the expected number of members.
SELECT
    g.name AS "Group Name",
    COUNT(u.id) AS "Member Count"
FROM
    groups g
JOIN
    users u ON g.id = u.group_id
GROUP BY
    g.name;

-- 1.3. Verify Role Counts: Confirms the total count of users assigned to each specific role.
SELECT
    r.name AS "Role Name",
    COUNT(ur.user_id) AS "User Count"
FROM
    roles r
JOIN
    user_roles ur ON r.id = ur.role_id
GROUP BY
    r.name
ORDER BY
    "User Count" DESC;

-- 1.4. Verify Role Permissions: Confirms a specific role has an expected permission.
SELECT
    r.name AS "Role",
    p.name AS "Permission"
FROM
    role_permissions rp
JOIN
    roles r ON rp.role_id = r.id
JOIN
    permissions p ON rp.permission_id = p.id
WHERE
    r.name = 'Student'
    OR r.name = 'Tutor'
ORDER BY
    r.name, p.name;

-- 1.5. Verify Stacking Permissions: Confirms a user with multiple roles at the same privilege level inherits ALL permissions.
SELECT
    u.name AS "User Name",
    STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) AS "Effective Permissions"
FROM
    users u
JOIN
    user_roles ur ON u.id = ur.user_id
JOIN
    role_permissions rp ON ur.role_id = rp.role_id
JOIN
    permissions p ON rp.permission_id = p.id
WHERE
    u.name = 'Bob' -- Bob has Role 1 (Student) and Role 2 (Team Lead), both at privilege_level 1.
GROUP BY
    u.name;

--------------------------------------------------------------------------------
-- 2. ACTIVITY LOGGING AND AUDIT VERIFICATION
--------------------------------------------------------------------------------

-- 2.1. Verify Log Linkage: Confirms activity_log joins correctly to the user, group, and activity type name.
SELECT
    u.name AS "Logged User",
    g.name AS "Logged Group",
    act.name AS "Activity Type",
    al.timestamp
FROM
    activity_log al
JOIN
    users u ON al.user_id = u.id
LEFT JOIN
    groups g ON al.group_id = g.id -- LEFT JOIN handles NULL group_id if user is unassigned
JOIN
    activity act ON al.activity_id = act.id
ORDER BY
    al.timestamp DESC;

-- 2.2. Verify JSONB Content: Checks that the JSONB field (al.content) has data for the login entry.
SELECT
    al.content AS "Login Activity" -- Using 'al.content' to resolve the ambiguity
FROM
    activity_log al
JOIN
    activity act ON al.activity_id = act.id
WHERE
    act.name = 'USER_LOGIN_SUCCESS';

--------------------------------------------------------------------------------
-- 3. AUTHENTICATION INTEGRITY
--------------------------------------------------------------------------------

-- 3.1. Verify Auth Link: Confirms user_auth records link to the user's name and provider information.
SELECT
    u.name,
    ua.email,
    ua.provider,
    LEFT(ua.access_token, 10) AS "Access Token Snippet"
FROM
    user_auth ua
JOIN
    users u ON ua.user_id = u.id
ORDER BY
    u.name;


--------------------------------------------------------------------------------
-- 4. APPLICATION DATA VERIFICATION (ATTENDANCE & JOURNALS)
--------------------------------------------------------------------------------

-- 4.1. Verify Attendance Recorder: Confirms the recorded_by (self-referencing FK) is working.
SELECT
    u.name AS "User",
    a.status,
    r.name AS "Recorded By",
    a.is_excused
FROM
    attendance a
JOIN
    users u ON a.user_id = u.id
JOIN
    users r ON a.recorded_by = r.id;

-- 4.2. Verify Journal Linkage: Confirms journal entries are tied to the user and group.
SELECT
    u.name AS "User",
    g.name AS "Group",
    j.did AS "What I Did"
FROM
    journals j
JOIN
    users u ON j.user_id = u.id
JOIN
    groups g ON j.group_id = g.id;

--------------------------------------------------------------------------------
-- 5. MESSAGING INTEGRITY
--------------------------------------------------------------------------------

-- 5.1. Verify Thread Users: Confirms the two users involved in the thread are correctly identified by name.
SELECT
    t.id AS "Thread ID",
    u1.name AS "User 1",
    u2.name AS "User 2"
FROM
    message_threads t
JOIN
    users u1 ON t.user1_id = u1.id
JOIN
    users u2 ON t.user2_id = u2.id
ORDER BY
    "Thread ID";

-- 5.2. Verify Message History: Confirms messages belong to the thread and correctly identify the sender.
SELECT
    t.id AS "Thread",
    u.name AS "Sender",
    m.content AS "Message Content"
FROM
    messages m
JOIN
    message_threads t ON m.thread_id = t.id
JOIN
    users u ON m.sender_id = u.id
ORDER BY
    m.sent_at;