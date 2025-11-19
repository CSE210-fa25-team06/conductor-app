/**
 * @file db/db-seeder.js
 * @description Programmatically seeds the database with initial roles, permissions, 
 * and their default associations based on configuration files.
 * * To run: node db/db-seeder.js
 */

const path = require('path');
// Import DB Model functions (Now includes the newly defined functions)
const { 
    createRole, 
    createPermission, 
    getPermissionIdByName, 
    linkRoleToPermission,
    pool // Need the pool to handle connections/cleanup
} = require('../../server/models/db'); 

// --- Load Configuration Files ---
// Paths are relative to the project root (where the seeder is run from)
const { permissions: permissionsConfig } = require('../config/permissions.json'); 
const { roles: rolesConfig } = require('../config/role-groups.json');

// --- Main Seeding Logic ---
async function seedRolesAndPermissions() {
    console.log('--- STARTING DATABASE SEEDER: ROLES AND PERMISSIONS ---');
    let client;
    
    try {
        client = await pool.connect();
        
        // =====================================================================
        // 0. CONFIGURATION VALIDATION (Enforces integrity across JSON files)
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
            console.error('\n*** CONFIGURATION SYNCHRONIZATION ERROR(S) DETECTED ***');
            validationErrors.forEach(err => console.error(err));
            console.error('*** SEEDING ABORTED. Fix config files and run again. ***');
            return; // Exit without touching the database
        }
        console.log('   - Configuration validated successfully.');

        // =====================================================================
        // 1. Seed Permissions Table (Master List)
        // =====================================================================
        console.log('\n1. Inserting/Updating master list of permissions...');
        for (const perm of permissionsConfig) {
            // createPermission should handle ON CONFLICT DO NOTHING/UPDATE for idempotency
            await createPermission(perm.name, perm.description);
            console.log(`   - Created permission: ${perm.name}`);
        }
        
        // =====================================================================
        // 2. Seed Roles Table and Store IDs
        // =====================================================================
        console.log('\n2. Inserting/Updating roles and resolving IDs...');
        const roleIdMap = {};

        for (const role of rolesConfig) {
            // createRole must accept (name, privilege_level, is_default)
            const roleId = await createRole(
                role.name, 
                role.privilege_level, 
                role.isDefault
            );
            roleIdMap[role.name] = roleId;
            console.log(`   - Created role: ${role.name} (ID: ${roleId}, Level: ${role.privilege_level})`);
        }

        // =====================================================================
        // 3. Seed Role-Permissions Junction Table (Associations)
        // =====================================================================
        console.log('\n3. Linking default permissions to roles...');
        let linkCount = 0;

        for (const role of rolesConfig) {
            const roleId = roleIdMap[role.name];
            
            if (role.default_permissions && role.default_permissions.length > 0) {
                console.log(`   -> Configuring ${role.name}:`);

                for (const permName of role.default_permissions) {
                    // Look up the DB ID for the permission name
                    const permissionId = await getPermissionIdByName(permName);

                    // Since validation passed in Step 0, this should always succeed
                    if (permissionId) {
                        // linkRoleToPermission should handle ON CONFLICT DO NOTHING
                        await linkRoleToPermission(roleId, permissionId);
                        console.log(`      - Linked: ${permName}`);
                        linkCount++;
                    }
                }
            }
        }
        
        console.log(`\n--- SEEDING COMPLETE: ${rolesConfig.length} Roles and ${linkCount} Permissions linked. ---`);

    } catch (error) {
        // Catch any unexpected database or system errors
        console.error('\n*** FATAL DATABASE SEEDING FAILED ***', error.message);
        process.exit(1); 
    } finally {
        // Ensure the pool connection is released
        if (client) client.release();
        // Force process exit to stop Node from waiting for PG pool timeout
        process.exit(0); 
    }
}

// Execute the seeder function
seedRolesAndPermissions();