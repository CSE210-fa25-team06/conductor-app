// The core mock functions are defined first and MUST be prefixed with 'mock' 
// if defined outside of the jest.mock factory to avoid the hoisting issue.
const mockQuery = jest.fn();
const mockConnect = jest.fn(() => ({
    query: mockQuery,
    release: jest.fn(), 
}));
const MockPool = jest.fn(() => ({
    query: mockQuery,
    connect: mockConnect, 
    end: jest.fn(), 
}));

// Mock the 'pg' library FIRST to control the database connection
jest.mock('pg', () => ({
    Pool: MockPool,
}));

const mockResolveUserPermissions = jest.fn();

jest.mock('../../../server/utils/permission-resolver', () => ({
    resolveUserPermissions: mockResolveUserPermissions,
    UNPRIVILEGED_THRESHOLD: 1
}));

// Import the module under test
const db = require('../../../server/models/db');

describe('DB Data Access Layer (DAL)', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockResolveUserPermissions.mockClear();
    });

    // =========================================================================
    // 1. Core Auth Functions (findUserIdByEmail, findUserIdInUsers)
    // =========================================================================

    describe('logSuccessfulLogin', () => {
        const mockUserId = 100;
        const mockIpAddress = '192.168.1.1';
        const mockActivityId = 13;
        const expectedActivityName = 'USER_LOGIN_SUCCESS';
        const expectedContent = JSON.stringify({ ip_address: mockIpAddress });

        test('should fetch activity ID and correctly log the successful login with JSONB content (4 ms)', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ id: mockActivityId }],
                rowCount: 1,
            });
            mockQuery.mockResolvedValueOnce({});

            await db.logSuccessfulLogin(mockUserId, mockIpAddress);

            expect(mockQuery).toHaveBeenCalledTimes(2);
            const selectCall = mockQuery.mock.calls[0];
            expect(selectCall[0]).toContain('SELECT id FROM activity');
            expect(selectCall[1]).toEqual([expectedActivityName]);
            
            const insertCall = mockQuery.mock.calls[1];
            expect(insertCall[0]).toContain('INSERT INTO activity_log (user_id, activity_id, content');
            expect(insertCall[1]).toEqual([
                mockUserId, 
                mockActivityId, 
                expectedContent
            ]);
        });

        test('should skip logging if the activity ID is not found (12 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            await db.logSuccessfulLogin(mockUserId, mockIpAddress);
            expect(mockQuery).toHaveBeenCalledTimes(1); 
        });
    });

    describe('findUserIdByEmail', () => {
        test('should return userId if user is found in user_auth table (2 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ user_id: 101 }], 
                rowCount: 1 
            });
            const userId = await db.findUserIdByEmail('test@example.com');
            expect(userId).toBe(101);
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery.mock.calls[0][1]).toEqual(['test@example.com']);
        });

        test('should return null if user is NOT found (1 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            const userId = await db.findUserIdByEmail('nonexistent@example.com');
            expect(userId).toBeNull();
        });

        test('should throw an error on database failure (28 ms)', async () => {
            mockQuery.mockRejectedValueOnce(new Error('PG Connection Timeout'));
            await expect(db.findUserIdByEmail('test@example.com')).rejects.toThrow('PG Connection Timeout');
        });
    });

    describe('findUserIdInUsers (Backup Lookup)', () => {
        test('should return userId from main users table (1 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ user_id: 102 }], 
                rowCount: 1 
            });
            const userId = await db.findUserIdInUsers('backup@example.com');
            expect(userId).toBe(102);
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // 2. Complex Retrieval (getFullUserData)
    // =========================================================================

    describe('getFullUserData', () => {
        test('should return null if no user is found for the given ID (1 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] }); // User query returns empty
            const userData = await db.getFullUserData(999);
            expect(userData).toBeNull();
        });

        test('should retrieve user data with stacked roles and permissions (3 ms)', async () => {
            // 1. Mock Response for First Query (Base User Info)
            const mockBaseUser = {
                rows: [{ 
                    id: 101, 
                    name: 'Austin', 
                    email: 'austin@test.com', 
                    groupName: 'Team Alpha' 
                }],
                rowCount: 1
            };

            // 2. Mock Response for Second Query (Roles & Permissions)
            const mockRoles = {
                rows: [
                    { 
                        role_id: 1, 
                        role_name: 'Student', 
                        privilege_level: 1, 
                        permission_id: 10, 
                        permission_name: 'EDIT_OWN_PROFILE_DATA' 
                    },
                    { 
                        role_id: 1, 
                        role_name: 'Student', 
                        privilege_level: 1, 
                        permission_id: 11, 
                        permission_name: 'USER_SUBMIT_JOURNAL' 
                    },
                    { 
                        role_id: 2, 
                        role_name: 'Group Leader', 
                        privilege_level: 1, 
                        permission_id: 12, 
                        permission_name: 'GROUP_MANAGE_ATTENDANCE' 
                    },
                ]
            };

            // Chain the mocks
            mockQuery
                .mockResolvedValueOnce(mockBaseUser)
                .mockResolvedValueOnce(mockRoles);

            const mockResolvedPermissions = {
                effectiveRoleName: 'Group Leader',
                permissions: new Set(['EDIT_OWN_PROFILE_DATA', 'USER_SUBMIT_JOURNAL', 'GROUP_MANAGE_ATTENDANCE'])
            };
            mockResolveUserPermissions.mockReturnValue(mockResolvedPermissions);

            const userData = await db.getFullUserData(101);
            
            expect(userData.id).toBe(101);
            expect(userData.name).toBe('Austin');
            expect(userData.groupName).toBe('Team Alpha');
            expect(userData.roles.length).toBe(2);
            expect(userData.effectiveRoleName).toBe('Group Leader');
            expect(userData.permissions).toContain('GROUP_MANAGE_ATTENDANCE');
        });
    });
    
    // =========================================================================
    // 3. getFullUserData (Refactor Check)
    // =========================================================================

    describe('getFullUserData (Refactor Check)', () => {
        // Mock data for Query 1: Base User
        const mockBaseUser = { 
            rows: [{ id: 1, email: 'a@test.com', name: 'User A', groupName: 'Team Gamma' }], 
            rowCount: 1 
        };

        // Mock data for Query 2: Roles
        const mockRoles = {
            rows: [{ 
                role_id: 100, role_name: 'Professor', privilege_level: 100,
                permission_id: 50, permission_name: 'PROVISION_USERS' 
            }]
        };

        const mockResolvedPermissions = {
            effectiveRoleName: 'Professor',
            permissions: new Set(['PROVISION_USERS'])
        };
        
        test('should retrieve user data with stacked roles and permissions (1 ms)', async () => {
            mockQuery
                .mockResolvedValueOnce(mockBaseUser)
                .mockResolvedValueOnce(mockRoles);

            mockResolveUserPermissions.mockReturnValue(mockResolvedPermissions); 
            
            const userData = await db.getFullUserData(1); 
            
            expect(userData.id).toBe(1); 
            expect(userData.permissions).toHaveLength(1); 
            expect(userData.roles).toHaveLength(1);
        });

        test('should return effectiveRoleName at the root level (Refactor Check)', async () => {
            mockQuery
                .mockResolvedValueOnce(mockBaseUser)
                .mockResolvedValueOnce(mockRoles);

            mockResolveUserPermissions.mockReturnValue(mockResolvedPermissions);
            
            const userData = await db.getFullUserData(1); 
            
            expect(userData.effectiveRoleName).toBe('Professor'); 
            expect(userData.permissions).toBeInstanceOf(Array); 
        });
    });
    
    // =========================================================================
    // 4. Seeding/Provisioning Functions
    // =========================================================================

    describe('createPermission', () => {
        test('should insert a new permission and return the new ID (1 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ id: 50 }], 
                rowCount: 1 
            });
            const newId = await db.createPermission('NEW_PERMISSION', 'Description for new feature');
            expect(newId).toBe(50);
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('insertUser', () => {
        test('should insert a new user and return the user ID (13 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ id: 200 }], 
                rowCount: 1 
            });
            const mockClient = { query: mockQuery }; 
            const newUserId = await db.insertUser(mockClient, 'new.user@email.com', 'New User', 5); 
            
            expect(newUserId).toBe(200);
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery.mock.calls[0][1][0]).toBe('new.user@email.com');
        });
    });
    
    describe('insertUserAuth', () => {
        test('should insert auth details for a user correctly (7 ms)', async () => {
            mockQuery.mockResolvedValueOnce({}); 
            const mockClient = { query: mockQuery }; 
            await db.insertUserAuth(mockClient, 200, 'google', 'new.user@email.com', 'token123', 'refresh456');
            
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery.mock.calls[0][0]).toContain("VALUES ($1, $2, $3, $4, $5)"); 
            expect(mockQuery.mock.calls[0][1]).toEqual([
                200, 'google', 'new.user@email.com', 'token123', 'refresh456'
            ]);
        });
    });

    // =========================================================================
    // 5. Transaction Management (assignRolesToUser)
    // =========================================================================

    describe('assignRolesToUser (Transaction)', () => {
        const userId = 300;
        const roleIds = [1, 2];
        let mockClient;

        beforeEach(() => {
            mockClient = {
                query: jest.fn(async (sql) => {
                    if (sql.startsWith('BEGIN')) return;
                    if (sql.startsWith('DELETE FROM user_roles')) return { rowCount: 1 };
                    if (sql.startsWith('INSERT INTO user_roles')) return { rowCount: roleIds.length };
                    if (sql.startsWith('COMMIT')) return;
                }),
                release: jest.fn(),
            };
            mockConnect.mockResolvedValue(mockClient);
        });

        test('should execute a transaction to delete and insert roles (2 ms)', async () => {
            const result = await db.assignRolesToUser(userId, roleIds);
            expect(result).toBe(true);
            expect(mockClient.query).toHaveBeenCalledTimes(4); // BEGIN, DELETE, INSERT, COMMIT
        });

        test('should call ROLLBACK on transaction failure and re-throw (7 ms)', async () => {
            const transactionError = new Error('Database connection dropped');
            mockClient.query.mockImplementation(async (sql) => {
                if (sql.startsWith('BEGIN')) return;
                if (sql.startsWith('DELETE FROM user_roles')) throw transactionError;
            });
            mockConnect.mockResolvedValue(mockClient);

            await expect(db.assignRolesToUser(userId, roleIds)).rejects.toThrow('Database connection dropped');
            expect(mockClient.query).toHaveBeenCalledTimes(3); // BEGIN, DELETE (fails), ROLLBACK
        });
        
        test('should handle empty roleIds array by only deleting and committing (1 ms)', async () => {
            await db.assignRolesToUser(userId, []);
            expect(mockClient.query).toHaveBeenCalledTimes(3); // BEGIN, DELETE, COMMIT
        });
    });

    // =========================================================================
    // 6. Role/Permission Seeding/Admin Functions
    // =========================================================================

    describe('createRole', () => {
        test('should insert a new role and return the new ID', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ id: 60 }], 
                rowCount: 1 
            });
            const newId = await db.createRole('ADMIN', 100, true);
            expect(newId).toBe(60);
        });
        
        test('should use ON CONFLICT DO UPDATE when role name exists (5 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ id: 61 }], 
                rowCount: 1 
            });
            await db.createRole('STUDENT', 1, false);
            expect(mockQuery.mock.calls[0][0]).toContain('ON CONFLICT (name) DO UPDATE');
        });
    });

    describe('linkRoleToPermission', () => {
        test('should insert a role-permission link using ON CONFLICT DO NOTHING (1 ms)', async () => {
            mockQuery.mockResolvedValueOnce({});
            await db.linkRoleToPermission(60, 50);
            expect(mockQuery).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // 7. Core Lookup Functions
    // =========================================================================

    describe('findGroupByName', () => {
        test('should return group object if found (6 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ id: 5, name: 'Team Gamma' }], 
                rowCount: 1 
            });
            const group = await db.findGroupByName('Team Gamma');
            expect(group).toEqual({ id: 5, name: 'Team Gamma' });
        });

        test('should return null if group is not found (5 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            const group = await db.findGroupByName('NonExistent Group');
            expect(group).toBeNull();
        });
    });
    
    describe('findRoleByName', () => {
        test('should return role object with privilege_level if found (1 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ id: 1, privilege_level: 1 }], 
                rowCount: 1 
            });
            const role = await db.findRoleByName('Student');
            expect(role).toEqual({ id: 1, privilege_level: 1 });
        });
    });
    
    describe('getPermissionIdByName', () => {
        test('should return ID if permission is found (1 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ 
                rows: [{ id: 10 }], 
                rowCount: 1 
            });
            const permissionId = await db.getPermissionIdByName('EDIT_OWN_PROFILE_DATA');
            expect(permissionId).toBe(10);
        });

        test('should return null if permission is NOT found (1 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            const permissionId = await db.getPermissionIdByName('NON_EXISTENT_PERM');
            expect(permissionId).toBeNull();
        });
    });

    describe('getRolePrivilegeLevel', () => {
        test('should return the privilege level for a role ID (2 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ privilege_level: 100 }], rowCount: 1 });
            const level = await db.getRolePrivilegeLevel(60);
            expect(level).toBe(100);
        });

        test('should throw an error if role ID is not found (1 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            await expect(db.getRolePrivilegeLevel(999)).rejects.toThrow('Role ID 999 not found.');
        });
    });
    
    // =========================================================================
    // 8. Simple Insert/Map Functions
    // =========================================================================

    describe('insertUserRole', () => {
        test('should insert a user role mapping correctly (7 ms)', async () => {
            mockQuery.mockResolvedValueOnce({});
            const mockClient = { query: mockQuery }; 
            await db.insertUserRole(mockClient, 300, 1);
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery.mock.calls[0][1]).toEqual([300, 1]); 
        });
    });

    describe('findGroupIdByName', () => {
        test('should return the ID for a group name (1 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 5 }], rowCount: 1 });
            const id = await db.findGroupIdByName('Team Alpha');
            expect(id).toBe(5);
        });

        test('should return null if group name is not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            const id = await db.findGroupIdByName('Unknown Group');
            expect(id).toBeNull();
        });
    });

    // =========================================================================
    // 9. New Provisioning Functions
    // =========================================================================

    describe('createGroup', () => {
        test('should create a new group and return its ID (5 ms)', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 5 }], rowCount: 1 }); 
            const newId = await db.createGroup('New Group', 'url', 'slack', 'repo');
            expect(newId).toBe(5);
        });
    });

    describe('setRolePermissions', () => {
        const mockPermissionNames = ['PERM_A', 'PERM_B'];
        let mockClient;

        beforeEach(() => {
            mockClient = {
                query: jest.fn(),
                release: jest.fn(),
            };
            mockConnect.mockResolvedValue(mockClient);
        });
        
        test('should execute a transaction to update permissions successfully (4 ms)', async () => {
            // Global mocks for lookup
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] })
                     .mockResolvedValueOnce({ rows: [{ id: 2 }] });
            
            // Client mocks for transaction
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({}) // DELETE
                .mockResolvedValueOnce({}) // INSERT A
                .mockResolvedValueOnce({}) // INSERT B
                .mockResolvedValueOnce({}); // COMMIT

            await db.setRolePermissions(5, mockPermissionNames);
            
            expect(mockQuery).toHaveBeenCalledTimes(2); 
            expect(mockClient.query).toHaveBeenCalledTimes(5); 
            expect(mockClient.query.mock.calls[4][0]).toBe('COMMIT');
        });

        test('should ROLLBACK on invalid permission name', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }) 
                     .mockResolvedValueOnce({ rows: [] }); // Returns empty/null
            
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({}) // DELETE
                .mockResolvedValue({});    // ROLLBACK

            await expect(db.setRolePermissions(5, mockPermissionNames)).rejects.toThrow(/Permission name 'PERM_B' not found./);
            
            expect(mockClient.query).toHaveBeenCalledTimes(3); 
            expect(mockClient.query.mock.calls[2][0]).toBe('ROLLBACK'); 
        });
    });

    // =========================================================================
    // 10. User Role Assignment Functions
    // =========================================================================

    describe('assignRolesToUser', () => {
        test('should execute a transaction to assign roles successfully (1 ms)', async () => {
            const mockRoleIds = [1, 2];
            const mockClient = {
                query: jest.fn()
                    .mockResolvedValueOnce({}) // BEGIN
                    .mockResolvedValueOnce({}) // DELETE
                    .mockResolvedValueOnce({}) // INSERT (UNNEST)
                    .mockResolvedValueOnce({}), // COMMIT
                release: jest.fn(),
            };
            mockConnect.mockResolvedValue(mockClient);

            await db.assignRolesToUser(10, mockRoleIds);
            
            expect(mockClient.query).toHaveBeenCalledTimes(4); 
            expect(mockClient.query.mock.calls[3][0]).toBe('COMMIT'); 
        });
    });
});