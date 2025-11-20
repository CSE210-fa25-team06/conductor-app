/**
 * @file __tests__/user-provisioning.test.js
 * @description Jest tests for the models/user-provisioning.js module.
 */

const { pool } = require('../../server/models/db');
const db = require('../../server/models/db'); 
const { 
    getProvisioningDetails,
    createUserAccount,
    linkProviderAccount,
    resetProvisioningCache 
} = require('../../server/services/user-provisioning');

// Mock the entire db.js module
jest.mock('../../server/models/db', () => ({
    // Mock the connection pool and transaction logic
    pool: {
        connect: jest.fn().mockResolvedValue({
            query: jest.fn(), // Placeholder for BEGIN/COMMIT/ROLLBACK/other queries
            release: jest.fn(),
        }),
        query: jest.fn(), // For individual queries outside a transaction
    },
    // Mock the core DB functions used by the module under test
    findGroupByName: jest.fn(),
    findRoleByName: jest.fn(),
    // Transactional insert functions now accept 'client' as the first argument
    insertUser: jest.fn(),
    insertUserRole: jest.fn(),
    insertUserAuth: jest.fn(),
}));

// Define the expected defaults from the provided role-groups.json
const DEFAULT_GROUP_NAME = 'Unassigned';
const DEFAULT_ROLE_NAME = 'Student';

// Define the simulated DB IDs for the defaults
const MOCKED_DEFAULT_GROUP_ID = 99;
const MOCKED_DEFAULT_ROLE_ID = 101;
const MOCKED_USER_ID = 500;

describe('User Provisioning Service Layer', () => {
    let mockClient; 

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Standard setup for transaction mocks
        mockClient = {
            query: jest.fn(async (sql) => {
                // Mock the expected transaction commands
                if (sql === 'BEGIN') return {};
                if (sql === 'COMMIT') return {};
                if (sql === 'ROLLBACK') return {};
                return {};
            }),
            release: jest.fn(),
        };
        db.pool.connect.mockResolvedValue(mockClient);

        // Setup mock return values for detail lookups
        db.findGroupByName.mockResolvedValue({ 
            id: MOCKED_DEFAULT_GROUP_ID, 
            name: DEFAULT_GROUP_NAME 
        });
        db.findRoleByName.mockResolvedValue({ 
            id: MOCKED_DEFAULT_ROLE_ID, 
            privilege_level: 1 
        });

        // Setup mock return value for user inserts
        db.insertUser.mockResolvedValue(MOCKED_USER_ID);
        db.insertUserRole.mockResolvedValue(true);
        db.insertUserAuth.mockResolvedValue(true);
    });

    describe('getProvisioningDetails', () => {
        it('should fetch and cache the default group and role IDs', async () => {
            const details = await getProvisioningDetails();

            expect(db.findGroupByName).toHaveBeenCalledWith(DEFAULT_GROUP_NAME);
            expect(db.findRoleByName).toHaveBeenCalledWith(DEFAULT_ROLE_NAME);
            
            expect(details.defaultGroupId).toBe(MOCKED_DEFAULT_GROUP_ID);
            expect(details.defaultRoleId).toBe(MOCKED_DEFAULT_ROLE_ID);
            
            // Call it again to test caching
            await getProvisioningDetails();
            expect(db.findGroupByName).toHaveBeenCalledTimes(1); // Should only be called once
        });

        it('should throw an error if the default group is not found in the DB', async () => {
            // Clear the module cache before this test runs, 
            resetProvisioningCache(); 
            db.findGroupByName.mockResolvedValue(null);
            await expect(getProvisioningDetails()).rejects.toThrow(/Default group.*not found/);
        });
    });

    describe('createUserAccount', () => { // RENAMED DESCRIBE BLOCK
        const testEmail = 'new.user@example.com';
        const testName = 'Test User';
        const testAccessToken = 'mock_access_token';
        const testRefreshToken = 'mock_refresh_token';
        const testProvider = 'google'; 

        it('should run all inserts within a transaction and commit successfully', async () => {
            const userId = await createUserAccount(testProvider, testEmail, testName, testAccessToken, testRefreshToken);
            
            // Check for transaction boundaries
            expect(db.pool.connect).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.query).not.toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
            
            // 1. Check user insert (no change in args for this function)
            const expectedInsertUserArgs = [mockClient, testEmail, testName, MOCKED_DEFAULT_GROUP_ID];
            expect(db.insertUser).toHaveBeenCalledWith(...expectedInsertUserArgs);
            expect(userId).toBe(MOCKED_USER_ID);

            // 2. Check role insert (no change in args)
            const expectedInsertRoleArgs = [mockClient, MOCKED_USER_ID, MOCKED_DEFAULT_ROLE_ID];
            expect(db.insertUserRole).toHaveBeenCalledWith(...expectedInsertRoleArgs);

            // 3. Check auth insert
            const expectedInsertAuthArgs = [mockClient, MOCKED_USER_ID, testProvider, testEmail, testAccessToken, testRefreshToken];
            expect(db.insertUserAuth).toHaveBeenCalledWith(...expectedInsertAuthArgs);
        });

        it('should use an empty string for null refreshToken and still succeed', async () => {

            await createUserAccount(testProvider, testEmail, testName, testAccessToken, null);

            const expectedInsertAuthArgs = [mockClient, MOCKED_USER_ID, testProvider, testEmail, testAccessToken, ''];
            expect(db.insertUserAuth).toHaveBeenCalledWith(...expectedInsertAuthArgs);
        });

        it('should rollback the transaction if any insert fails', async () => {
            // Force a failure in the middle step (insertUserRole)
            db.insertUserRole.mockRejectedValue(new Error('DB failure on role assignment'));

            await expect(
                createUserAccount(testProvider, testEmail, testName, testAccessToken, testRefreshToken)
            ).rejects.toThrow('DB failure on role assignment');

            // Check for transaction rollback
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
            // The failure happened during insertUserRole, so insertUserAuth should not have been called
            expect(db.insertUserAuth).not.toHaveBeenCalled(); 
        });
    });

    describe('linkProviderAccount', () => {
        const existingUserId = 42;
        const testProvider = 'google';
        const testEmail = 'existing.user@example.com';
        const testAccessToken = 'mock_access_token_link';
        const testRefreshToken = 'mock_refresh_token_link';
        
        it('should insert into user_auth for an existing user, using the specified provider', async () => {
            db.pool.query.mockResolvedValue(true);
            
            const userId = await linkProviderAccount(existingUserId, testProvider, testEmail, testAccessToken, testRefreshToken);

            expect(db.pool.query).toHaveBeenCalledTimes(1);
            // Check the query arguments to ensure it looks like an INSERT INTO user_auth
            expect(db.pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO user_auth'),
                [existingUserId, testProvider, testEmail, testAccessToken, testRefreshToken]
            );
            expect(userId).toBe(existingUserId);
        });

        it('should use an empty string for null refreshToken', async () => {
            db.pool.query.mockResolvedValue(true);

            await linkProviderAccount(existingUserId, testProvider, testEmail, testAccessToken, null);

            expect(db.pool.query).toHaveBeenCalledWith(
                expect.any(String),
                [existingUserId, testProvider, testEmail, testAccessToken, '']
            );
        });
        
        it('should throw error on failure', async () => {
            db.pool.query.mockRejectedValue(new Error('Link failure'));

            await expect(
                linkProviderAccount(existingUserId, testProvider, testEmail, testAccessToken, testRefreshToken)
            ).rejects.toThrow('Link failure');
        });
    });
});