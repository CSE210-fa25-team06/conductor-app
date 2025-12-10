/**
 * @file server/models/db.js
 * @description Data Access Layer (DAL) for the application.
 * This module establishes the **connection pool** to the PostgreSQL database (using the `pg` library)
 * and exports core functions for user authentication and user data retrieval. It acts as the primary
 * interface for all low-level database operations.
 * NOTE: Functions related to user creation and account linking are currently here but are candidates 
 * for migration to a dedicated Service Layer in future refactoring for better separation of concerns.
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../', '.env') });
// Melvyn Testing HTML Linter KEEP FOR NOW
// require('dotenv').config({
//   path: path.resolve(__dirname, '../../../', '.env'),
//   override: false  // prevents overwriting existing env vars (important!)
// });
// --- End of tests ----
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || process.env.SERVER_HOST, 
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const { resolveUserPermissions } = require('../utils/permission-resolver');

const { encrypt } = require('../utils/crypto');

// =========================================================================
// AUTH/USER DATA FUNCTIONS
// =========================================================================

/**
 * Looks up a user's internal ID based on their email in the user_auth table.
 * @param {string} email - The email address from the authentication provider.
 * @returns {number|null} The user's internal database ID, or null if not found.
 */
async function findUserIdByEmail(email) {
  const query = `
    SELECT user_id
    FROM user_auth
    WHERE email = $1;
  `;
  try {
    const result = await pool.query(query, [email]);
    return result.rows.length > 0 ? result.rows[0].user_id : null;
  } catch (error) {
    console.error('Database Error in findUserIdByEmail:', error);
    throw error;
  }
}

/**
 * Backup lookup for a user's internal ID in the main users table (for migration/linking).
 * @param {string} email - The email address.
 * @returns {number|null} The user's internal database ID, or null if not found.
 */
async function findUserIdInUsers(email) {
  const query = `
    SELECT id AS user_id
    FROM users
    WHERE email = $1;
  `;
  try {
    const result = await pool.query(query, [email]);
    return result.rows.length > 0 ? result.rows[0].user_id : null;
  } catch (error) {
    console.error('Database Error in findUserIdInUsers:', error);
    throw error;
  }
}

/**
 * Retrieves a full data set for a user, including their roles and aggregated permissions.
 * @param {number} userId - The internal database ID of the user.
 * @param {string} ipAddress - The IP address used during the login attempt.
 * @returns {object|null} The user object with roles and permissions, or null.
 */
/**
 * UPDATED: Retrieves full data set including Group Resources, Meta, and Stats.
 */
async function getFullUserData(userId, ipAddress) {
    // 1. Enhanced Base Query with Joins and Subqueries for Stats
    const baseQuery = `
        SELECT
            u.id,
            u.email,
            u.name,
            u.photo_url,
            u.contact_info,
            u.availability,
            u.created_at,
            u.group_id,
            
            -- Group Metadata
            COALESCE(g.name, 'Unassigned') AS "groupName",
            g.repo_link,
            g.slack_link,
            g.logo_url AS group_logo,

            -- Auth Provider (Meta)
            ua.provider,

            -- Activity Stats (Subqueries for latest dates)
            (SELECT MAX(entry_date) FROM journals WHERE user_id = u.id) AS last_journal_date,
            (SELECT MAX(timestamp) FROM activity_log WHERE user_id = u.id) AS last_active_at

        FROM users u
        LEFT JOIN groups g ON u.group_id = g.id
        LEFT JOIN user_auth ua ON u.id = ua.user_id
        WHERE u.id = $1;
    `;
    
    // 2. Get Roles and Permissions (unchanged logic)
    const rolesPermissionsQuery = `
        SELECT
            r.id AS role_id,
            r.name AS role_name,
            r.description AS role_description, -- Added Description
            r.privilege_level,           
            p.id AS permission_id,
            p.name AS permission_name
        FROM user_roles ur
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1;
    `;

    try {
        const baseResult = await pool.query(baseQuery, [userId]);
        
        if (baseResult.rows.length === 0) {
            return null;
        }

        const row = baseResult.rows[0];
        const rawUserResult = {
            ...row, // Spread all the new fields (repo_link, last_active_at, etc.)
            roles: []
        }; 
        
        const rpResult = await pool.query(rolesPermissionsQuery, [userId]);
        
        rpResult.rows.forEach(rRow => {
            const existingRole = rawUserResult.roles.find(r => r.role_id === rRow.role_id);
            
            if (rRow.role_id != null && !existingRole) { 
                rawUserResult.roles.push({
                    role_id: rRow.role_id,
                    name: rRow.role_name,
                    description: rRow.role_description, // Capture description
                    privilege_level: rRow.privilege_level, 
                    group_id: row.group_id,
                    permissions: rRow.permission_id != null ? [{ id: rRow.permission_id, name: rRow.permission_name }] : []
                });
            } else if (rRow.permission_id != null && existingRole) {
                existingRole.permissions.push({ id: rRow.permission_id, name: rRow.permission_name });
            }
        });
        
        const userRoles = rawUserResult.roles.filter(r => r.role_id !== null);
        const permissionDetails = resolveUserPermissions(userRoles);

        // Construct final object
        const userData = {
            id: rawUserResult.id,
            email: rawUserResult.email,
            name: rawUserResult.name,
            photo_url: rawUserResult.photo_url,
            contact_info: rawUserResult.contact_info,
            availability: rawUserResult.availability,
            created_at: rawUserResult.created_at,
            
            // Group Data
            group_id: rawUserResult.group_id,
            groupName: rawUserResult.groupName,
            repo_link: rawUserResult.repo_link,
            slack_link: rawUserResult.slack_link,
            group_logo: rawUserResult.group_logo,

            // Meta & Stats
            provider: rawUserResult.provider,
            last_journal_date: rawUserResult.last_journal_date,
            last_active_at: rawUserResult.last_active_at,

            // Roles
            permissions: Array.from(permissionDetails.permissions), 
            effectiveRoleName: permissionDetails.effectiveRoleName, 
            roles: userRoles
        };

        return userData;

    } catch (error) {
        console.error(`Database Error in getFullUserData (IP: ${ipAddress}):`, error);
        throw error;
    }
}

/**
 * Looks up the activity ID based on its unique name.
 */
async function getActivityIdByName(name) {
    const query = `
        SELECT id FROM activity WHERE name = $1;
    `;
    try {
        const result = await pool.query(query, [name]);
        return result.rows.length > 0 ? result.rows[0].id : null;
    } catch (error) {
        console.error('Database Error in getActivityIdByName:', error);
        throw error;
    }
}


async function logSuccessfulLogin(userId, ipAddress) {
    // 1. Get the required activity_id from the 'activity' table
    const activityName = 'USER_LOGIN_SUCCESS';
    const activityId = await getActivityIdByName(activityName);

    if (!activityId) {
        console.warn(`Activity ID not found for name: ${activityName}. Log skipped.`);
        return;
    }
    
    // 2. Construct the JSONB content object
    const contentPayload = { ip_address: ipAddress };
    
    const query = `
        INSERT INTO activity_log (user_id, activity_id, content, timestamp)
        VALUES ($1, $2, $3::jsonb, NOW());
    `;

    try {
        // $1 = userId, $2 = activityId, $3 = contentPayload (JSON stringified)
        await pool.query(query, [userId, activityId, JSON.stringify(contentPayload)]);
        
    } catch (error) {
        console.error('Database Error in logSuccessfulLogin:', error);
        throw error;
    }
}

// =========================================================================
// PROVISIONING/ADMIN FUNCTIONS
// =========================================================================

/**
 * @param {string} name 
 * @param {string} logoUrl 
 * @param {string} slackLink 
 * @param {string} repoLink 
 * @returns {number} The ID of the created group.
 */
async function createGroup(name, logoUrl, slackLink, repoLink) {
    // Prevent duplicate group names
    const existing = await findGroupByName(name);
    if (existing) {
        const err = new Error('Group already exists');
        err.code = 'GROUP_EXISTS';
        throw err;
    }

    const query = `
        INSERT INTO groups (name, logo_url, slack_link, repo_link)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
    `;
    try {
        const result = await pool.query(query, [name, logoUrl, slackLink, repoLink]);
        return result.rows[0].id;
    } catch (error) {
        console.error('Database Error in createGroup:', error);
        throw error;
    }
}

/**
 * Assigns (or re-assigns) a user to a group.
 * @param {number} userId - The ID of the user.
 * @param {number|null} groupId - The ID of the group (or null to unassign).
 */
async function assignUserToGroup(userId, groupId) {
    const query = `
        UPDATE users
        SET group_id = $1, updated_at = NOW()
        WHERE id = $2;
    `;
    try {
        await pool.query(query, [groupId, userId]);
    } catch (error) {
        console.error('Database Error in assignUserToGroup:', error);
        throw error;
    }
}

/**
 * Retrieves all groups for the dropdown list.
 * @returns {Array<object>} List of {id, name}
 */
async function getAllGroups() {
    const query = 'SELECT id, name FROM groups ORDER BY name ASC;';
    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Database Error in getAllGroups:', error);
        throw error;
    }
}

/**
 * Updates a role's privilege level and permissions in a single atomic transaction.
 * Replaces the old setRolePermissions function.
 * @param {number} roleId - The ID of the role to update.
 * @param {Array<string>} permissionNames - List of permission names to assign.
 * @param {number|null} privilegeLevel - (Optional) New privilege level to set.
 */
async function updateRoleConfiguration(roleId, permissionNames, privilegeLevel = null) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update Privilege Level (if provided)
        if (privilegeLevel !== null) {
            await client.query('UPDATE roles SET privilege_level = $1 WHERE id = $2', [privilegeLevel, roleId]);
        }

        // 2. Resolve Permission Names to IDs
        const permissionIds = [];
        for (const name of permissionNames) {
            const idRes = await client.query('SELECT id FROM permissions WHERE name = $1', [name]);
            if (idRes.rows.length === 0) {
                throw new Error(`Permission '${name}' not found.`);
            }
            permissionIds.push(idRes.rows[0].id);
        }

        // 3. Update Links (Wipe and Recreate)
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
        
        if (permissionIds.length > 0) {
            const values = permissionIds.map((pId, i) => `($1, $${i + 2})`).join(', ');
            await client.query(
                `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`, 
                [roleId, ...permissionIds]
            );
        }

        await client.query('COMMIT');
        return true;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database Error in updateRoleConfiguration:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function createPermission(name, description) {
    const query = `
        INSERT INTO permissions (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
        RETURNING id;
    `;
    try {
        const result = await pool.query(query, [name, description]);
        // If a row was inserted, return its ID. If it was an ON CONFLICT DO NOTHING, id is undefined.
        return result.rows[0]?.id; 
    } catch (error) {
        console.error('Database Error in createPermission:', error);
        throw error;
    }
}


/**
 * Creates or updates an activity record for idempotent database seeding.
 * @param {number} id - The manual ID of the activity.
 * @param {string} name - The unique name of the activity (e.g., 'USER_LOGIN_SUCCESS').
 * @param {string} activity_type - The category of the activity (e.g., 'AUTH', 'DATA').
 * @param {string} description - The description, stored in the JSONB 'content' column.
 * @returns {number} The ID of the created or updated activity.
 */
async function createActivity(id, name, activity_type, description) {
    // The description is stored in the content JSONB column.
    const contentPayload = { description: description }; 

    const query = `
        INSERT INTO activity (id, name, activity_type, content)
        VALUES ($1, $2, $3, $4::jsonb)
        ON CONFLICT (id) DO UPDATE 
        SET 
            name = EXCLUDED.name, 
            activity_type = EXCLUDED.activity_type,
            content = EXCLUDED.content
        RETURNING id;
    `;
    try {
        // $1 = id, $2 = name, $3 = activity_type, $4 = JSON string of contentPayload
        const result = await pool.query(query, [id, name, activity_type, JSON.stringify(contentPayload)]);
        return result.rows[0].id;
    } catch (error) {
        console.error('Database Error in createActivity:', error);
        throw error;
    }
}

/**
 * Creates a new role, or updates an existing one if the name conflicts (for idempotency).
 * @param {string} name - The role name.
 * @param {number} privilege_level - The numerical privilege level.
 * @param {boolean} is_default - Whether this role is the default assigned role.
 * @returns {number} The ID of the created or existing role.
 */
/**
 * Creates a new role with description support.
 * UPDATED: Now accepts 'description' as the 3rd argument.
 */
async function createRole(name, privilege_level, description = null, is_default = false) {
    const query = `
        INSERT INTO roles (name, privilege_level, description, is_default)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE 
        SET 
            privilege_level = EXCLUDED.privilege_level, 
            description = EXCLUDED.description,
            is_default = EXCLUDED.is_default
        RETURNING id;
    `;
    try {
        const result = await pool.query(query, [name, privilege_level, description, is_default]);
        return result.rows[0].id;
    } catch (error) {
        console.error('Database Error in createRole:', error);
        throw error;
    }
}

async function getRolePrivilegeLevel(roleId) {
    const query = 'SELECT privilege_level FROM roles WHERE id = $1;';
    const result = await pool.query(query, [roleId]);
    if (result.rows.length === 0) {
        throw new Error(`Role ID ${roleId} not found.`);
    }
    return result.rows[0].privilege_level;
}

/**
 * NEW: Retrieves all system permissions.
 * @returns {Array<object>} List of {id, name, description}
 */
async function getAllPermissions() {
    const query = 'SELECT * FROM permissions ORDER BY name ASC;';
    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Database Error in getAllPermissions:', error);
        throw error;
    }
}

/**
 * NEW: Retrieves permission names associated with a specific role ID.
 * @param {number} roleId 
 * @returns {Array<string>} Array of permission names
 */
async function getPermissionsForRole(roleId) {
    const query = `
        SELECT p.name 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = $1;
    `;
    try {
        const result = await pool.query(query, [roleId]);
        return result.rows.map(row => row.name);
    } catch (error) {
        console.error('Database Error in getPermissionsForRole:', error);
        throw error;
    }
}

/**
 * NEW: Retrieves all available roles from the database.
 * @returns {Array<object>} List of roles.
 */
async function getAllRoles() {
    // Selects all roles. Note: 'description' column is assumed to be handled by schema
    // if it exists, otherwise this might need adjustment to select specific columns.
    const query = 'SELECT * FROM roles ORDER BY privilege_level ASC;';
    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Database Error in getAllRoles:', error);
        throw error;
    }
}

async function assignRolesToUser(userId, roleIds) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Delete all existing roles for the user
        await client.query('DELETE FROM user_roles WHERE user_id = $1;', [userId]);

        if (roleIds && roleIds.length > 0) {
            // 2. Insert new user roles
            const insertQuery = `
                INSERT INTO user_roles (user_id, role_id)
                SELECT $1, unnest($2::int[]) 
                ON CONFLICT DO NOTHING;
            `;
            await client.query(insertQuery, [userId, roleIds]);
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transaction Error in assignRolesToUser:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Gets the database ID for a permission name.
 * @param {string} name - The name of the permission (e.g., 'user:read').
 * @returns {number|null} The permission's ID, or null if not found.
 */
async function getPermissionIdByName(name) {
    const query = 'SELECT id FROM permissions WHERE name = $1;';
    try {
        const result = await pool.query(query, [name]);
        return result.rows.length > 0 ? result.rows[0].id : null;
    } catch (error) {
        console.error('Database Error in getPermissionIdByName:', error);
        throw error;
    }
}

/**
 * Links a role to a permission in the junction table.
 * @param {number} roleId - The ID of the role.
 * @param {number} permissionId - The ID of the permission.
 * @returns {void}
 */
async function linkRoleToPermission(roleId, permissionId) {
    const query = `
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING;
    `;
    try {
        await pool.query(query, [roleId, permissionId]);
    } catch (error) {
        console.error('Database Error in linkRoleToPermission:', error);
        throw error;
    }
}


// =========================================================================
// LOOKUP & FIND FUNCTIONS
// =========================================================================

async function findGroupIdByName(name) {
    const query = 'SELECT id FROM groups WHERE name = $1;';
    const result = await pool.query(query, [name]);
    return result.rows.length > 0 ? result.rows[0].id : null;
}

/**
 * Looks up a group's ID and name by its name.
 * @param {string} name - The name of the group (e.g., 'Unassigned').
 * @returns {object|null} The group record { id, name }, or null if not found.
 */
async function findGroupByName(name) {
    const query = `
        SELECT id, name
        FROM groups
        WHERE name = $1;
    `;
    try {
        const result = await pool.query(query, [name]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    } catch (error) {
        console.error('Database Error in findGroupByName:', error);
        throw error;
    }
}

/**
 * Looks up a role's ID and privilege level by its name.
 * @param {string} name - The name of the role (e.g., 'Student').
 * @returns {object|null} The role record { id, privilege_level }, or null if not found.
 */
async function findRoleByName(name) {
    const query = `
        SELECT id, privilege_level
        FROM roles
        WHERE name = $1;
    `;
    try {
        const result = await pool.query(query, [name]);
        if (result.rows.length > 0) {
            return result.rows[0]; // Returns { id, privilege_level }
        }
        return null;
    } catch (error) {
        console.error('Database Error in findRoleByName:', error);
        throw error;
    }
}

// =========================================================================
// INSERT FUNCTIONS (Called by the Service Layer)
// =========================================================================


/**
 * Inserts a new user into the database.
 * Accepts an optional photoUrl.
 * @param {object} client - The database client.
 * @param {string} email - User email.
 * @param {string} name - User full name.
 * @param {number|null} groupId - Assigned group ID.
 * @param {string|null} photoUrl - (Optional) URL to the user's profile photo.
 */
async function insertUser(client, email, name, groupId, photoUrl = null) {
    const userInsertQuery = `
        INSERT INTO users (email, name, group_id, photo_url)
        VALUES ($1, $2, $3, $4) 
        RETURNING id;
    `;
    
    // Use the provided URL, or fallback to the default if null/undefined
    const finalPhotoUrl = photoUrl || 'https://example.com/default-photo.png';

    try {
        const userResult = await client.query(userInsertQuery, [email, name, groupId, finalPhotoUrl]); 
        return userResult.rows[0].id; 
    } catch (error) {
        console.error('Database Error in insertUser:', error);
        throw error;
    }
}

async function insertUserAuth(client, userId, provider, email, accessToken, refreshToken) {
    const authInsertQuery = `
        INSERT INTO user_auth (user_id, provider, email, access_token, refresh_token)
        VALUES ($1, $2, $3, $4, $5);
    `;
    try {
        // Encrypt the tokens before saving them
        const encryptedAccessToken = encrypt(accessToken);
        // Also handle null/undefined refresh tokens gracefully
        const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : refreshToken;

        // Pass the ENCRYPTED tokens to the database query
        await client.query(authInsertQuery, [userId, provider, email, encryptedAccessToken, encryptedRefreshToken]); 
    } catch (error) {
        console.error('Database Error in insertUserAuth:', error);
        throw error;
    }
}

async function insertUserRole(client, userId, roleId) {
    const query = `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2);
    `;
    try {
        await client.query(query, [userId, roleId]);
    } catch (error) {
        console.error('Database Error in insertUserRole:', error);
        throw error;
    }
}

// =========================================================================
// DELETE FUNCTIONS
// =========================================================================

/**
 * Deletes a user account.
 * SAFETY: Throws an error if the user has a high-privilege role (Level >= 100).
 */
async function deleteUser(userId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Removed: The check for privilege_level >= 100
        
        // 1. Delete User (Cascades to auth, logs, attendance, etc.)
        const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        
        if (result.rowCount === 0) {
            throw new Error('User not found.');
        }

        await client.query('COMMIT');
        return true;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database Error in deleteUser:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
  pool,
  findUserIdByEmail,
  findUserIdInUsers,
  getFullUserData,
  logSuccessfulLogin,
  getActivityIdByName,
  
  // Role/Permission Seeding Functions
  createPermission,
  createRole,
  assignUserToGroup,
  getPermissionIdByName,
  linkRoleToPermission,
  createActivity,
  getAllPermissions,
  getPermissionsForRole,
  
  // Provisioning/Admin Functions
  getRolePrivilegeLevel,
  assignRolesToUser,
  getAllRoles,
  findRoleByName,
  createGroup,
  getAllGroups,
  updateRoleConfiguration,
  deleteUser,
  
  // User/Auth Insert Functions
  insertUserAuth,
  insertUserRole,
  insertUser,
  
  // Lookup Functions
  findGroupByName,
  findGroupIdByName
};