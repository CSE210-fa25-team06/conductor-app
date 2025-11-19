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
    findRoleByName
} = require('../models/db'); 
const roleGroupConfig = require('../config/role-groups.json'); 

let provisioningDetails = null;

/**
 * NEW: Helper function for testing to clear the internal cache.
 */
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
 */
async function createGoogleUser(email, name, accessToken, refreshToken) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Ensure provisioning details are loaded (including default role/group IDs)
        const { defaultGroupId, defaultRoleId } = await getProvisioningDetails(); 

        // 1. Insert into users table (using the default group)
        // FIX: Pass the 'client' to ensure this insert runs in the transaction.
        const userId = await insertUser(client, email, name, defaultGroupId); 
        
        // 2. Insert into user_roles table (using the default role)
        // FIX: Pass the 'client' to ensure this insert runs in the transaction.
        await insertUserRole(client, userId, defaultRoleId);
        
        // 3. Insert into user_auth table for Google strategy linkage
        const nonNullRefreshToken = refreshToken || ''; 
        // FIX: Pass the 'client' to ensure this insert runs in the transaction.
        await insertUserAuth(client, userId, email, accessToken, nonNullRefreshToken);
        
        await client.query('COMMIT');
        
        console.log(`[PROVISIONING] New user provisioned: ${email} (ID: ${userId}) to Group ${defaultGroupId} and Role ${defaultRoleId}`);
        return userId;
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Transaction Error in createGoogleUser:', e);
        throw e;
    } finally {
        client.release();
    }
}

/**
 * Links a missing provider record for an EXISTING user.
 */
async function linkGoogleAccount(userId, email, accessToken, refreshToken) {
    try {
        const nonNullRefreshToken = refreshToken || ''; 
        const authInsertQuery = `
            INSERT INTO user_auth (user_id, provider, email, access_token, refresh_token)
            VALUES ($1, $2, $3, $4, $5);
        `;
        await pool.query(authInsertQuery, [userId, 'google', email, accessToken, nonNullRefreshToken]);
        
        console.log(`[PROVISIONING] Existing user linked to Google provider: ${email} (ID: ${userId})`);
        return userId;
    } catch (error) {
        console.error('Database Error in linkGoogleAccount:', error);
        throw error;
    }
}

module.exports = {
    getProvisioningDetails,
    createGoogleUser,
    linkGoogleAccount,
    resetProvisioningCache // EXPORTED FOR TESTING
};