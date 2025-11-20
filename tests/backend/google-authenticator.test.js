const request = require('supertest');
const express = require('express');

// =========================================================================
// MOCK DEPENDENCIES
// =========================================================================

// 1. Mock Database Functions
const mockDb = {
    findUserIdByEmail: jest.fn(),
    findUserIdInUsers: jest.fn(),
    logSuccessfulLogin: jest.fn(),
};
jest.mock('../../server/models/db', () => mockDb);

// 2. Mock User Provisioning Functions
const mockProvisioning = {
    createUserAccount: jest.fn(),
    linkProviderAccount: jest.fn(),
};
jest.mock('../../server/services/user-provisioning', () => mockProvisioning);


// 3. Mock Passport and capture the Strategy's verify function
let verifyCallback; 
let MockGoogleStrategy = class {
    constructor(options, verify) {
        verifyCallback = verify;
    }
};

const mockAuthMiddleware = jest.fn((req, res, next) => next());

const mockPassport = {
    use: jest.fn(),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn(),
    
    authenticate: jest.fn(() => (req, res, next) => mockAuthMiddleware(req, res, next)), 
};

jest.mock('passport', () => mockPassport);
jest.mock('passport-google-oauth20', () => ({ Strategy: MockGoogleStrategy }));

// 4. Import the module under test *after* all mocks are set up
const { router } = require('../../server/services/auth/google/google-authenticator');

// Extract Passport global callbacks immediately after require.
const serializeCallback = mockPassport.serializeUser.mock.calls[0] ? mockPassport.serializeUser.mock.calls[0][0] : null;
const deserializeCallback = mockPassport.deserializeUser.mock.calls[0] ? mockPassport.deserializeUser.mock.calls[0][0] : null;


// Create a simple Express app to use Supertest against the router
const app = express();
app.use(router);

// =========================================================================
// TEST DATA
// =========================================================================

const mockProfile = {
    emails: [{ value: 'test@example.com' }],
    displayName: 'Test User',
};
const mockAccessToken = 'mock-access-token';
const mockRefreshToken = 'mock-refresh-token';
const mockDone = jest.fn();
const mockUserId = 101;


describe('Google Authenticator (Passport Strategy)', () => {

    beforeEach(() => {
        // Clear Data Mocks
        mockDb.findUserIdByEmail.mockClear();
        mockDb.findUserIdInUsers.mockClear();
        mockDb.logSuccessfulLogin.mockClear();
        mockProvisioning.createUserAccount.mockClear();
        mockProvisioning.linkProviderAccount.mockClear();
        mockDone.mockClear();
        
        mockAuthMiddleware.mockClear();
        mockAuthMiddleware.mockImplementation((req, res, next) => next());
    });

    // =========================================================================
    // GoogleStrategy Verification Callback
    // =========================================================================
    describe('GoogleStrategy Verification Callback', () => {

        it('should call passport.use with the GoogleStrategy', () => {
            expect(mockPassport.use).toHaveBeenCalled();
            expect(mockPassport.use).toHaveBeenCalledWith(expect.any(MockGoogleStrategy));
        });

        it('should handle an existing user found via user_auth (Case 1: Linked User)', async () => {
            mockDb.findUserIdByEmail.mockResolvedValue(mockUserId); 
            await verifyCallback(mockAccessToken, mockRefreshToken, mockProfile, mockDone);
            expect(mockDb.logSuccessfulLogin).toHaveBeenCalledWith(mockUserId, expect.any(String));
            expect(mockDone).toHaveBeenCalledWith(null, mockUserId);
        });

        it('should link the account if user exists in users but not user_auth (Case 2: Unlinked User)', async () => {
            mockDb.findUserIdByEmail.mockResolvedValue(null);
            mockDb.findUserIdInUsers.mockResolvedValue(mockUserId);
            await verifyCallback(mockAccessToken, mockRefreshToken, mockProfile, mockDone);
            expect(mockProvisioning.linkProviderAccount).toHaveBeenCalled();
            expect(mockDone).toHaveBeenCalledWith(null, mockUserId);
        });

        it('should create a new account if the user is brand new (Case 3: New User)', async () => {
            const newUserId = 202;
            mockDb.findUserIdByEmail.mockResolvedValue(null);
            mockDb.findUserIdInUsers.mockResolvedValue(null);
            mockProvisioning.createUserAccount.mockResolvedValue(newUserId); 
            await verifyCallback(mockAccessToken, mockRefreshToken, mockProfile, mockDone);
            expect(mockProvisioning.createUserAccount).toHaveBeenCalled();
            expect(mockDone).toHaveBeenCalledWith(null, newUserId);
        });

        it('should return an error if a database operation fails during verification', async () => {
            const dbError = new Error('DB connection failed');
            mockDb.findUserIdByEmail.mockRejectedValue(dbError);
            await verifyCallback(mockAccessToken, mockRefreshToken, mockProfile, mockDone);
            expect(mockDone).toHaveBeenCalledWith(dbError, null);
        });
    });
    
    // =========================================================================
    // Passport Serializer/Deserializer
    // =========================================================================
    describe('Passport Serializer/Deserializer', () => {
        
        it('should serialize the user ID directly', () => {
            expect(serializeCallback).not.toBeNull(); 
            const done = jest.fn();
            serializeCallback(mockUserId, done);
            expect(done).toHaveBeenCalledWith(null, mockUserId);
        });
        
        it('should deserialize the user ID directly (simplistic implementation)', async () => {
            expect(deserializeCallback).not.toBeNull();
            const done = jest.fn();
            mockDb.findUserIdInUsers.mockResolvedValue(true); 
            await deserializeCallback(mockUserId, done);
            expect(done).toHaveBeenCalledWith(null, mockUserId); 
        });
    });

    // =========================================================================
    // Router Redirect Tests
    // =========================================================================
    describe('Passport Router Configuration', () => {
        
        it('GET /google should initiate the Google OAuth flow', async () => {
            const expectedOptions = { 
                scope: ['profile', 'email'],
                accessType: 'offline',
                prompt: 'consent'
            };

            expect(mockPassport.authenticate).toHaveBeenCalledWith('google', expectedOptions);
            expect(mockPassport.authenticate).toHaveBeenCalledTimes(2); 

            await request(app).get('/google');
        });

        it('GET /callback/google should redirect to /dashboard.html on success', async () => {
            mockAuthMiddleware.mockImplementation((req, res, next) => {
                req.user = mockUserId; // Simulate Passport populating the user
                next(); // Proceed to the success handler in the router
            });
            
            const response = await request(app).get('/callback/google');
            
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe('/dashboard.html');
        });

        it('GET /callback/google should redirect to /api/auth/login-fail on failure', async () => {
            const failureRedirect = '/api/auth/login-fail?error=google_failed';

            mockAuthMiddleware.mockImplementation((req, res, next) => {
                // Simulate Passport failing by redirecting immediately
                // and NOT calling next()
                res.redirect(failureRedirect);
            });

            const response = await request(app).get('/callback/google');

            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe(failureRedirect);
        });
    });
});