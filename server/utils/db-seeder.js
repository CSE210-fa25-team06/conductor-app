/**
 * @file db/db-seeder.js
 * @description Programmatically seeds the database with initial roles, permissions, 
 * and their default associations based on configuration files.
 * To run: node server/utils/db-seeder.js
 */

const { 
    createRole, 
    createPermission, 
    createGroup,
    createActivity,
    getPermissionIdByName, 
    linkRoleToPermission,
    insertUser,
    insertUserRole,
    insertUserAuth,
    pool
} = require('../../server/models/db'); 

const { permissions: permissionsConfig } = require('../config/data/permissions.json'); 
const { 
    roles: rolesConfig,
    groups: groupsConfig
} = require('../config/data/role-groups.json');
const { activities: activitiesConfig } = require('../config/data/activity-config.json');

let deployUsersConfig = [];
try {
    deployUsersConfig = require('../config/data/deploy-users.json');
} catch (e) {
    console.warn('   ! Notice: deploy-users.json not found. Skipping real user provisioning.');
}

async function seedRolesAndPermissions() {
    console.log('--- STARTING DATABASE SEEDER: SYNC MODE ---');
    let client;
    
    try {
        client = await pool.connect();
        
        // =====================================================================
        // 0. CONFIGURATION VALIDATION
        // =====================================================================
        console.log('0. Performing configuration validation...');
        const masterPermissionNames = new Set(permissionsConfig.map(p => p.name));
        const validationErrors = [];

        for (const role of rolesConfig) {
            if (role.default_permissions) {
                for (const permName of role.default_permissions) {
                    if (!masterPermissionNames.has(permName)) {
                        validationErrors.push(
                            `ERROR: Role '${role.name}' references non-existent permission '${permName}'.`
                        );
                    }
                }
            }
        }

        if (validationErrors.length > 0) {
            console.error('\n*** CONFIG VALIDATION FAILED ***');
            validationErrors.forEach(err => console.error(err));
            return;
        }
        console.log('   - Configuration validated.');

        // =====================================================================
        // 1. Seed Permissions (Master List)
        // =====================================================================
        console.log('\n1. Syncing master list of permissions...');
        for (const perm of permissionsConfig) {
            try {
                await createPermission(perm.name, perm.description);
            } catch (err) {
                if (err.code !== '23505') throw err; 
            }
        }
        console.log(`   - Processed ${permissionsConfig.length} permissions.`);
        
        // =====================================================================
        // 2. Seed Activities
        // =====================================================================
        console.log('\n2. Syncing master list of activities...');
        for (const act of activitiesConfig) {
            try {
                await createActivity(act.id, act.name, act.activity_type, act.description); 
            } catch (err) {
                if (err.code !== '23505') throw err;
            }
        }
        console.log(`   - Processed ${activitiesConfig.length} activities.`);

        // =====================================================================
        // 3. Seed Groups (Check Exists -> Get ID)
        // =====================================================================
        console.log('\n3. Syncing Groups...');
        let defaultGroupId = null; 

        for (const group of groupsConfig) {
            // CHECK: Does group exist?
            const checkRes = await client.query('SELECT id FROM groups WHERE name = $1', [group.name]);
            
            if (checkRes.rows.length > 0) {
                console.log(`   - Skipped creation: '${group.name}' already exists.`);
                if (group.isDefault) defaultGroupId = checkRes.rows[0].id;
            } else {
                // CREATE
                const newId = await createGroup(group.name, null, null, null);
                console.log(`   - Created group: ${group.name}`);
                if (group.isDefault) defaultGroupId = newId;
            }
        }

        // =====================================================================
        // 4. Seed Roles (Check Exists -> Get ID)
        // =====================================================================
        console.log('\n4. Syncing Roles...');
        const roleIdMap = {};

        for (const role of rolesConfig) {
            let roleId;
            // CHECK: Does role exist?
            const checkRes = await client.query('SELECT id FROM roles WHERE name = $1', [role.name]);

            if (checkRes.rows.length > 0) {
                roleId = checkRes.rows[0].id;
                console.log(`   - Found existing role: '${role.name}' (ID: ${roleId})`);
            } 
            
            // FIX: Ensure we call createRole with the correct arguments to update/create
            // Arg Order: (name, privilege_level, description, is_default)
            // This runs an UPSERT, so it will fix the "false" descriptions in your DB.
            roleId = await createRole(
                role.name, 
                role.privilege_level, 
                role.description, // <--- Correctly passing description here
                role.isDefault
            );
            console.log(`   - Synced role: ${role.name} (ID: ${roleId})`);
            
            roleIdMap[role.name] = roleId;
        }

        // =====================================================================
        // 5. Sync Role Permissions (Delete Old -> Insert New)
        // =====================================================================
        console.log('\n5. Relinking permissions (Full Sync)...');
        let linkCount = 0;

        for (const role of rolesConfig) {
            const roleId = roleIdMap[role.name];
            
            if (roleId) {
                // A. WIPE EXISTING PERMISSIONS
                await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

                // B. ADD NEW PERMISSIONS
                if (role.default_permissions && role.default_permissions.length > 0) {
                    for (const permName of role.default_permissions) {
                        const permissionId = await getPermissionIdByName(permName);
                        if (permissionId) {
                            await linkRoleToPermission(roleId, permissionId);
                            linkCount++;
                        }
                    }
                    console.log(`   - Refreshed ${role.default_permissions.length} permissions for '${role.name}'`);
                }
            }
        }

        // =====================================================================
        // 6. Seed Demo Users (Mock Auth)
        // =====================================================================
        console.log('\n6. Verifying Demo Users...');
        
        if (!defaultGroupId) {
            console.warn('   ! WARNING: No default group found. Skipping user generation.');
        } else {
            for (const role of rolesConfig) {
                const email = `${role.name.replace(/\s+/g, '_').toLowerCase()}@test.com`;
                const name = `${role.name} Demo User`;
                const roleId = roleIdMap[role.name];

                const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);

                if (userCheck.rows.length === 0) {
                    const userId = await insertUser(client, email, name, defaultGroupId, null);
                    await insertUserRole(client, userId, roleId);
                    // DEMO USERS get fake auth tokens so they can log in via the Mock Strategy
                    await insertUserAuth(client, userId, 'google', email, 'mock_access_token', 'mock_refresh_token');
                    console.log(`   - Created User: ${email} -> Role: ${role.name}`);
                } else {
                    console.log(`   - User ${email} already exists.`);
                }
            }
        }

        // =====================================================================
        // 7. Seed Real Users (Pre-Provisioning)
        // =====================================================================
        console.log('\n7. Seeding Real Users (from deploy-users.json)...');
        
        if (deployUsersConfig.length > 0) {
            for (const realUser of deployUsersConfig) {
                // Check if user exists
                const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [realUser.email]);
                
                if (userCheck.rows.length === 0) {
                    // 1. Find Role ID
                    const roleId = roleIdMap[realUser.role];
                    if (!roleId) {
                        console.error(`   ! ERROR: Role '${realUser.role}' not found for user ${realUser.email}. Skipping.`);
                        continue;
                    }

                    // 2. Find Group ID (Optional)
                    let groupId = defaultGroupId;
                    if (realUser.group) {
                         const groupRes = await client.query('SELECT id FROM groups WHERE name = $1', [realUser.group]);
                         if (groupRes.rows.length > 0) groupId = groupRes.rows[0].id;
                    }

                    // 3. Create User & Role
                    const userId = await insertUser(client, realUser.email, realUser.name, groupId, null);
                    await insertUserRole(client, userId, roleId);
                    
                    // NOTE: We do NOT insertUserAuth here. The user will link their account
                    // when they sign in with Google for the first time.
                    console.log(`   - Provisioned Real User: ${realUser.email} (${realUser.role})`);
                } else {
                    console.log(`   - Real User ${realUser.email} already exists.`);
                }
            }
        } else {
            console.log('   - No real users found in deploy-users.json.');
        }
        
        console.log(`\n--- DB SYNC COMPLETE: Permissions Relinked: ${linkCount} ---`);

    } catch (error) {
        console.error('\n*** SEEDING FAILED ***', error);
        process.exit(1); 
    } finally {
        if (client) client.release();
        process.exit(0); 
    }
}

seedRolesAndPermissions();