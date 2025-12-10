/**
 * @file models/user-provisioning.js
 * @description User Provisioning Layer: Handles all logic related to creating
 * new user records, assigning defaults, and linking authentication providers.
 */

const { 
    pool,
    insertUser, 
    insertUserRole,
    insertUserAuth,
    findGroupByName,
    findRoleByName,
    findUserIdInUsers
} = require('../models/db'); 
const roleGroupConfig = require('../config/data/role-groups.json'); 
const { isEmailAllowed } = require('../services/auth/whitelist-manager');

let provisioningDetails = null;

function resetProvisioningCache() {
    provisioningDetails = null;
}

/**
 * Looks up the database IDs for all roles and groups defined in the config file.
 * Caches the result, and identifies the IDs for the configured defaults.
 * @returns {object} An object containing { defaultGroupId, defaultRoleId }.
 * @throws {Error} If a configured default group or role is not found in the database.
 */
async function getProvisioningDetails() {
    if (provisioningDetails) {
        return provisioningDetails; // Return cached values
    }

    // 1. Identify the *names* of the defaults from the JSON config (must be marked with isDefault: true)
    const defaultGroupConfig = roleGroupConfig.groups.find(g => g.isDefault);
    const defaultRoleConfig = roleGroupConfig.roles.find(r => r.isDefault);
    
    if (!defaultGroupConfig || !defaultRoleConfig) {
         throw new Error('Config Error: roles-groups.json must specify one default group and one default role.');
    }
    const defaultGroupName = defaultGroupConfig.name;
    const defaultRoleName = defaultRoleConfig.name;

    // 2. Query the database to get the IDs for the defaults
    try {
        const defaultGroupRecord = await findGroupByName(defaultGroupName);
        const defaultRoleRecord = await findRoleByName(defaultRoleName);

        if (!defaultGroupRecord) {
             throw new Error(`DB Error: Default group '${defaultGroupName}' not found in database. Did you seed 'Unassigned'?`);
        }
        if (!defaultRoleRecord) {
             throw new Error(`DB Error: Default role '${defaultRoleName}' not found in database. Did you seed 'Student'?`);
        }
        
        provisioningDetails = {
            defaultGroupId: defaultGroupRecord.id,
            defaultRoleId: defaultRoleRecord.id,
        };
        
        console.log(`[PROVISIONING] Found defaults: Group ID ${provisioningDetails.defaultGroupId}, Role ID ${provisioningDetails.defaultRoleId}`);
        
        return provisioningDetails;
        
    } catch (error) {
        console.error('Failed to retrieve provisioning details:', error);
        throw error;
    }
}


/**
 * Provisions a brand new user into the system (users, user_auth, and user_roles).
 * Automatically assigns the user to the configured default role and group.
 * @param {string} provider The name of the authentication provider (e.g., 'google', 'linkedin').
 */
async function createUserAccount(provider, email, name, accessToken, refreshToken, photoUrl = null) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Ensure provisioning details are loaded (including default role/group IDs)
        const { defaultGroupId, defaultRoleId } = await getProvisioningDetails();

        // 1. Insert into users table (using the default group)
        const userId = await insertUser(client, email, name, defaultGroupId, photoUrl); 
        
        // 2. Insert into user_roles table (using the default role)
        await insertUserRole(client, userId, defaultRoleId);
        
        // 3. Insert into user_auth table for strategy linkage
        const nonNullRefreshToken = refreshToken || ''; 
        await insertUserAuth(client, userId, provider, email, accessToken, nonNullRefreshToken);
        
        await client.query('COMMIT');
        
        console.log(`[PROVISIONING] New user provisioned: ${email} (ID: ${userId}) for provider ${provider} to Group ${defaultGroupId} and Role ${defaultRoleId}`);
        return userId;
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Transaction Error in createUserAccount:', e); // RENAMED FUNCTION
        throw e;
    } finally {
        client.release();
    }
}

/**
 * Bulk provisions users from a parsed CSV array.
 * NOTE: This creates the user record but DOES NOT create a user_auth record.
 * The user_auth record is created when the user logs in via Google for the first time
 * and triggers the 'linkProviderAccount' logic.
 * * @param {Array<Object>} csvRows - Array of objects { email, name, role, group }
 * @returns {Object} Summary of successes and failures
 */
async function bulkProvisionUsers(csvRows) {
    const results = { success: 0, failed: 0, skipped: 0, errors: [] }; // Added 'skipped'
    const client = await pool.connect();

    try {
        const defaults = await getProvisioningDetails();

        for (const row of csvRows) {
            const email = row.email.trim();
            const name = row.name.trim();

            // 1. Skip non-whitelisted emails
            if (!isEmailAllowed(email)) {
                console.log(`[BULK SKIP] ${email} is not whitelisted.`);
                results.skipped++;
                continue; 
            }

            // 2. NEW: Skip existing users to prevent DB errors
            const existingUser = await findUserIdInUsers(email);
            if (existingUser) {
                console.log(`[BULK SKIP] User ${email} already exists.`);
                results.skipped++;
                continue;
            }

            try {
                await client.query('BEGIN');
                
                // 3. Resolve Role ID (Use CSV value or Default)
                let roleId = defaults.defaultRoleId;
                if (row.role) {
                    const roleRecord = await findRoleByName(row.role.trim());
                    if (roleRecord) roleId = roleRecord.id;
                    else console.warn(`[BULK] Role '${row.role}' not found, using default.`);
                }

                // 4. Resolve Group ID (Use CSV value or Default)
                let groupId = defaults.defaultGroupId;
                if (row.group) {
                    const groupRecord = await findGroupByName(row.group.trim());
                    if (groupRecord) groupId = groupRecord.id;
                    else console.warn(`[BULK] Group '${row.group}' not found, using default.`);
                }

                // 5. Insert User
                const userId = await insertUser(client, email, name, groupId, null);

                // 6. Insert Role
                await insertUserRole(client, userId, roleId);

                await client.query('COMMIT');
                results.success++;
                console.log(`[BULK] Pre-provisioned user: ${email}`);

            } catch (rowError) {
                await client.query('ROLLBACK');
                results.failed++;
                results.errors.push({ email: row.email, error: rowError.message });
                console.error(`[BULK] Failed to provision ${row.email}:`, rowError.message);
            }
        }
    } catch (err) {
        console.error('Bulk Provisioning Fatal Error:', err);
        throw err;
    } finally {
        client.release();
    }

    return results;
}

/**
 * Links a missing provider record for an EXISTING user.
 * @param {string} provider The name of the authentication provider (e.g., 'google', 'linkedin').
 */
async function linkProviderAccount(userId, provider, email, accessToken, refreshToken) { // ADDED PROVIDER
    try {
        const nonNullRefreshToken = refreshToken || ''; 
        const authInsertQuery = `
            INSERT INTO user_auth (user_id, provider, email, access_token, refresh_token)
            VALUES ($1, $2, $3, $4, $5);
        `;
        await pool.query(authInsertQuery, [userId, provider, email, accessToken, nonNullRefreshToken]);
        
        console.log(`[PROVISIONING] Existing user linked to ${provider} provider: ${email} (ID: ${userId})`); // USE PROVIDER
        return userId;
    } catch (error) {
        console.error('Database Error in linkProviderAccount:', error);
        throw error;
    }
}

module.exports = {
    getProvisioningDetails,
    createUserAccount,
    bulkProvisionUsers,
    linkProviderAccount,
    resetProvisioningCache
};