/**
 * @file __tests__/user-provisioning.test.js
 * @description Jest tests for the models/user-provisioning.js module.
 */

l = require('../../server/services/user-provisioning')
// 1. Mock the DB module at the top level
jest.mock('../../server/models/db', () => ({
    pool: { connect: jest.fn(), query: jest.fn() },
    findGroupByName: jest.fn(),
    findRoleByName: jest.fn(),
    insertUser: jest.fn(),
    insertUserRole: jest.fn(),
    insertUserAuth: jest.fn(),
}));

const DEFAULT_GROUP_NAME = 'Unassigned';
const MOCKED_DEFAULT_GROUP_ID = 99;
const MOCKED_DEFAULT_ROLE_ID = 101;
const MOCKED_USER_ID = 500;

describe('User Provisioning Layer', () => {
    let db;
    let userProvisioningModel;
    let mockClient; 

    beforeEach(() => {
        // 1. Reset modules to ensure total isolation between tests
        jest.resetModules();

        // 2. Re-require the mocked DB and the Module under test
        // We use the path 'models/user-provisioning' based on your file header
        db = require('../../server/models/db');
        userProvisioningModel = require('../../server/services/user-provisioning');

        // 3. Setup the mock client for transactions
        mockClient = {
            query: jest.fn(async (sql) => {
                if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return {};
                return {};
            }),
            release: jest.fn(),
        };
        
        // 4. Configure the fresh mock implementations
        db.pool.connect.mockResolvedValue(mockClient);
        db.pool.query.mockResolvedValue(true);

        db.findGroupByName.mockResolvedValue({ 
            id: MOCKED_DEFAULT_GROUP_ID, 
            name: DEFAULT_GROUP_NAME 
        });
        db.findRoleByName.mockResolvedValue({ 
            id: MOCKED_DEFAULT_ROLE_ID, 
            privilege_level: 1 
        });
        
        // Configure inserts to verify they receive the correct 'client'
        db.insertUser.mockImplementation(async (client, email, name, groupId) => {
            expect(client).toBe(mockClient); 
            return MOCKED_USER_ID; 
        });
        db.insertUserRole.mockImplementation(async (client, userId, roleId) => {
            expect(client).toBe(mockClient);
            return true;
        });
        db.insertUserAuth.mockImplementation(async (client, userId, provider, email, accessToken, refreshToken) => {
            expect(client).toBe(mockClient);
            return true;
        });
    });

    // -------------------------------------------------------------------------
    // TEST GROUP 1: getProvisioningDetails
    // -------------------------------------------------------------------------

    describe('getProvisioningDetails', () => {
        it('should fetch and cache the default group and role IDs', async () => {
            const details = await userProvisioningModel.getProvisioningDetails();
            expect(db.findGroupByName).toHaveBeenCalledTimes(1); 
            expect(details.defaultGroupId).toBe(MOCKED_DEFAULT_GROUP_ID);
            
            // Call again to test caching (should not call findGroupByName again)
            await userProvisioningModel.getProvisioningDetails();
            expect(db.findGroupByName).toHaveBeenCalledTimes(1); 
        });

        it('should throw an error if the default group is not found in the DB', async () => {
            // 1. Reset modules again to clear the beforeEach setup
            jest.resetModules(); 

            // 2. Define the failure mock
            jest.doMock('../../server/models/db', () => ({
                pool: { connect: jest.fn(), query: jest.fn() },
                findGroupByName: jest.fn().mockResolvedValue(null), // FAILURE CONDITION
                findRoleByName: jest.fn().mockResolvedValue({ id: MOCKED_DEFAULT_ROLE_ID, privilege_level: 1 }),
                insertUser: jest.fn(), insertUserRole: jest.fn(), insertUserAuth: jest.fn(),
            }));

            // 3. Require the module again so it picks up the failed mock
            const freshModel = require('../../server/services/user-provisioning');

            await expect(freshModel.getProvisioningDetails()).rejects.toThrow(/Default group.*not found/);
        });
    });

    // -------------------------------------------------------------------------
    // TEST GROUP 2: createUserAccount (Renamed from createGoogleUser)
    // -------------------------------------------------------------------------

    describe('createUserAccount', () => {
        const testProvider = 'google'; // Define provider for tests
        const testEmail = 'new.user@example.com';
        const testName = 'Test User';
        const testAccessToken = 'mock_access_token';
        const testRefreshToken = 'mock_refresh_token';

        it('should run all inserts within a transaction and commit successfully', async () => {
            // Call with provider as first argument
            const userId = await userProvisioningModel.createUserAccount(testProvider, testEmail, testName, testAccessToken, testRefreshToken);
            
            // Transaction Checks
            expect(db.pool.connect).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.query).not.toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
            
            // Data Integrity Checks
            expect(db.insertUser).toHaveBeenCalledWith(mockClient, testEmail, testName, MOCKED_DEFAULT_GROUP_ID);
            expect(userId).toBe(MOCKED_USER_ID);
            expect(db.insertUserRole).toHaveBeenCalledWith(mockClient, MOCKED_USER_ID, MOCKED_DEFAULT_ROLE_ID);
            
            // Check that provider is passed correctly
            expect(db.insertUserAuth).toHaveBeenCalledWith(
                mockClient, 
                MOCKED_USER_ID, 
                testProvider, 
                testEmail, 
                testAccessToken, 
                testRefreshToken
            );
        });

        it('should rollback the transaction if any insert fails', async () => {
            // Set the mock to fail
            db.insertUserRole.mockRejectedValue(new Error('DB failure on role assignment'));

            await expect(
                userProvisioningModel.createUserAccount(testProvider, testEmail, testName, testAccessToken, testRefreshToken)
            ).rejects.toThrow('DB failure on role assignment');

            // Transaction Check: Rollback must happen
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
            
            expect(db.insertUserAuth).not.toHaveBeenCalled(); 
        });
        
        it('should use an empty string for null refreshToken and still succeed', async () => {
            await userProvisioningModel.createUserAccount(testProvider, testEmail, testName, testAccessToken, null);

            expect(db.insertUserAuth).toHaveBeenCalledWith(
                mockClient,
                MOCKED_USER_ID, 
                testProvider, 
                testEmail, 
                testAccessToken, 
                ''
            );
        });
    });

    // -------------------------------------------------------------------------
    // TEST GROUP 3: linkProviderAccount (Renamed from linkGoogleAccount)
    // -------------------------------------------------------------------------

    describe('linkProviderAccount', () => {
        const existingUserId = 42;
        const testProvider = 'google'; // Define provider
        const testEmail = 'existing.user@example.com';
        const testAccessToken = 'mock_access_token_link';
        const testRefreshToken = 'mock_refresh_token_link';
        
        it('should insert into user_auth for an existing user', async () => {
            // Call with provider argument
            const userId = await userProvisioningModel.linkProviderAccount(existingUserId, testProvider, testEmail, testAccessToken, testRefreshToken);

            expect(db.pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO user_auth'),
                [existingUserId, testProvider, testEmail, testAccessToken, testRefreshToken]
            );
            expect(userId).toBe(existingUserId);
        });

        it('should use an empty string for null refreshToken', async () => {
            await userProvisioningModel.linkProviderAccount(existingUserId, testProvider, testEmail, testAccessToken, null);

            expect(db.pool.query).toHaveBeenCalledWith(
                expect.any(String),
                [existingUserId, testProvider, testEmail, testAccessToken, '']
            );
        });
        
        it('should throw error on failure', async () => {
            db.pool.query.mockRejectedValue(new Error('Link failure'));

            await expect(
                userProvisioningModel.linkProviderAccount(existingUserId, testProvider, testEmail, testAccessToken, testRefreshToken)
            ).rejects.toThrow('Link failure');
        });
    });
});