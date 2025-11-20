/**
 * @file db/db-seeder.js
 * @description Programmatically seeds the database with initial roles, permissions, 
 * and their default associations based on configuration files.
 * * To run: node db/db-seeder.js
 */

const path = require('path');

const { 
    createRole, 
    createPermission, 
    createGroup,
    createActivity,
    getPermissionIdByName, 
    linkRoleToPermission,
    pool
} = require('../../server/models/db'); 


const { permissions: permissionsConfig } = require('../config/permissions.json'); 
const { 
    roles: rolesConfig,
    groups: groupsConfig
} = require('../config/role-groups.json');
const { activities: activitiesConfig } = require('../config/activity-config.json'); // <--- NEW: Import Activity Config

async function seedRolesAndPermissions() {
    console.log('--- STARTING DATABASE SEEDER: ROLES, PERMISSIONS, GROUPS, AND ACTIVITIES ---'); // Updated title
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
            await createPermission(perm.name, perm.description);
            console.log(`   - Created permission: ${perm.name}`);
        }
        
        // =====================================================================
        // 2. Seed Activities Table (New Step)
        // =====================================================================
        console.log('\n2. Inserting/Updating master list of activities...');
        for (const act of activitiesConfig) {
            // createActivity must accept (id, name, type, description)
            // Note: The description is being used to populate the 'content' JSONB column in the schema.sql table.
            await createActivity(act.id, act.name, act.activity_type, act.description); 
            console.log(`   - Created activity: ${act.id}: ${act.name}`);
        }

        // =====================================================================
        // 3. Seed Groups Table (Updated Step Number)
        // =====================================================================
        console.log('\n3. Inserting/Updating groups...');
        for (const group of groupsConfig) {
            await createGroup(group.name, group.isDefault, group.description);
            console.log(`   - Created group: ${group.name} (Default: ${!!group.isDefault})`);
        }

        // =====================================================================
        // 4. Seed Roles Table and Store IDs (Updated Step Number)
        // =====================================================================
        console.log('\n4. Inserting/Updating roles and resolving IDs...');
        const roleIdMap = {};

        for (const role of rolesConfig) {
            const roleId = await createRole(
                role.name, 
                role.privilege_level, 
                role.isDefault
            );
            roleIdMap[role.name] = roleId;
            console.log(`   - Created role: ${role.name} (ID: ${roleId}, Level: ${role.privilege_level})`);
        }

        // =====================================================================
        // 5. Seed Role-Permissions Junction Table (Associations) (Updated Step Number)
        // =====================================================================
        console.log('\n5. Linking default permissions to roles...');
        let linkCount = 0;

        for (const role of rolesConfig) {
            const roleId = roleIdMap[role.name];
            
            if (role.default_permissions && role.default_permissions.length > 0) {
                console.log(`   -> Configuring ${role.name}:`);

                for (const permName of role.default_permissions) {
                    const permissionId = await getPermissionIdByName(permName);

                    if (permissionId) {
                        await linkRoleToPermission(roleId, permissionId);
                        console.log(`      - Linked: ${permName}`);
                        linkCount++;
                    }
                }
            }
        }
        
        console.log(`\n--- SEEDING COMPLETE: ${rolesConfig.length} Roles, ${groupsConfig.length} Groups, ${activitiesConfig.length} Activities, and ${linkCount} Permissions linked. ---`); // Updated summary

    } catch (error) {
        console.error('\n*** FATAL DATABASE SEEDING FAILED ***', error.message);
        process.exit(1); 
    } finally {
        if (client) client.release();
        process.exit(0); 
    }
}

// Execute the seeder function
seedRolesAndPermissions();