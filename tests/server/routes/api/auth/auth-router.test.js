const request = require('supertest');
const express = require('express');
const { handleUserLogin } = require('../../../../../server/services/auth/auth-service');
const authRouter = require('../../../../../server/routes/api/auth/auth-router');

// 1. Setup Mock Dependencies
jest.mock('../../../../../server/services/auth/auth-service', () => ({
    handleUserLogin: jest.fn(),
}));

jest.mock('../../../../../server/middleware/auth/auth-mounter', () => {
    const express = require('express');
    
    // Mock the mounter to return a simple empty router for strategy-specific routes
    return jest.fn(() => express.Router());
});

// Sample user data for successful response
const mockUserData = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    permissions: ['read:data'],
};

// =========================================================================
// Helper to create a clean, dedicated app for isolated testing
// =========================================================================
const createTestApp = (sessionState, clearCookieSpy = jest.fn(), logoutSpy = undefined) => {
    const app = express();
    
    // Middleware to set the required session/auth state for this specific test
    app.use((req, res, next) => {
        req.session = {
            userId: sessionState.userId,
            // Allow overriding destroy for specific tests
            destroy: sessionState.destroy || jest.fn((cb) => cb()), 
        };
        req.user = sessionState.user;
        
        // Use provided logout spy or mock the default (Passport-style) req.logout
        req.logout = logoutSpy || jest.fn((cb) => cb()); 

        res.clearCookie = clearCookieSpy;
        req.isAuthenticated = () => !!req.user || !!req.session.userId;

        next();
    });
    
    // Mount the router under test
    app.use('/api/auth', authRouter);
    return app;
};


describe('Auth Router Generic Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks before each test
    });

    // =========================================================================
    // GET /session Tests
    // =========================================================================
    describe('GET /api/auth/session', () => {
        
        it('should return 401 and not authenticated message if no session or Passport user exists', async () => {
            handleUserLogin.mockClear();
            const app = createTestApp({ userId: null, user: null }); 
            
            const response = await request(app).get('/api/auth/session');

            expect(response.statusCode).toBe(401);
            expect(response.body.success).toBe(false);
            // The router returns a generic 'User is not authenticated.' if req.isAuthenticated() fails
            expect(response.body.message).toBe('User is not authenticated.'); 
            expect(handleUserLogin).not.toHaveBeenCalled();
        });

        it('should return 200 and user data if authenticated via session.userId (SSO/Mock)', async () => {
            handleUserLogin.mockResolvedValue(mockUserData);
            
            // Setup: userId in session (SSO/Mock)
            const app = createTestApp({ userId: 1, user: null }); 

            const response = await request(app).get('/api/auth/session');

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toEqual(mockUserData);
            // In the router, we now look for req.user or req.session.userId. If req.user is null, it uses req.session.userId (1)
            expect(handleUserLogin).toHaveBeenCalledWith(1, expect.any(String)); 
        });

        it('should return 200 and user data if authenticated via req.user (Passport)', async () => {
            handleUserLogin.mockResolvedValue(mockUserData);
            
            // Setup: req.user with an id (Passport). NOTE: req.user is passed directly to handleUserLogin
            const passportUser = { id: 2, name: 'Passport' };
            const app = createTestApp({ userId: null, user: passportUser });

            const response = await request(app).get('/api/auth/session');

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            // The router passes req.user (the full object) to handleUserLogin
            expect(handleUserLogin).toHaveBeenCalledWith(passportUser, expect.any(String)); 
        });
        
        it('should return 401 and auto-logout if session exists but handleUserLogin returns null (Stale Session)', async () => {
            // Setup: Session exists, but service finds no user (stale session)
            handleUserLogin.mockResolvedValue(null);
            
            const mockLogout = jest.fn((cb) => cb());
            
            // Set up an active session (userId: 1) and a logout spy to check auto-logout
            const app = createTestApp({ userId: 1, user: null }, jest.fn(), mockLogout);

            const response = await request(app).get('/api/auth/session');

            expect(response.statusCode).toBe(401);
            expect(response.body.success).toBe(false);
            // The router returns this specific message on stale session
            expect(response.body.message).toBe('Invalid session. User data not found. Forced logout.'); 
            expect(handleUserLogin).toHaveBeenCalled();
            expect(mockLogout).toHaveBeenCalled(); // Should call req.logout on stale session
        });
        
it('should return 500 and destroy session on handleUserLogin error', async () => {
             // Setup: Service throws an error (simulating DB failure)
             handleUserLogin.mockRejectedValue(new Error('DB connection failed'));
            
             // Create a spy for session.destroy
             const mockDestroy = jest.fn((cb) => cb());
             const clearCookieSpy = jest.fn();
             
             // Setup app with active session (userId: 1) and the destroy spy
             const app = createTestApp(
                 { userId: 1, user: null, destroy: mockDestroy },
                 clearCookieSpy
             );
 
             const response = await request(app).get('/api/auth/session');
 
             // Assertions
             expect(response.statusCode).toBe(500);
             expect(response.body.success).toBe(false);
             
             // Ensure the session was destroyed to prevent bad state loops
             expect(mockDestroy).toHaveBeenCalled();
             expect(clearCookieSpy).toHaveBeenCalledWith('connect.sid');
        });
    });

    // =========================================================================
    // GET /logout Tests (Matching the router's current GET method)
    // =========================================================================
    describe('GET /api/auth/logout', () => {
        
        it('should use req.logout (Passport method) if req.user is available', async () => {
            const mockLogout = jest.fn((cb) => cb());
            const clearCookieSpy = jest.fn();
            
            // req.user exists, so it uses req.logout
            const app = createTestApp(
                { userId: 1, user: { id: 1 } }, 
                clearCookieSpy, 
                mockLogout 
            );

            const response = await request(app).get('/api/auth/logout'); 

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockLogout).toHaveBeenCalled();
            expect(clearCookieSpy).toHaveBeenCalledWith('connect.sid');
        });

        it('should fall back to session.destroy (SSO/Mock method) if req.user is null but session.userId is defined', async () => {
            const mockDestroy = jest.fn((cb) => cb());
            const clearCookieSpy = jest.fn();

            const app = createTestApp(
                { userId: 1, user: null, destroy: mockDestroy }, // Active session via userId, with destroy spy
                clearCookieSpy, 
                undefined // We don't need a specific logout spy here as req.user is null
            );
            
            const response = await request(app).get('/api/auth/logout');

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockDestroy).toHaveBeenCalled(); // session.destroy should be called
            expect(clearCookieSpy).toHaveBeenCalledWith('connect.sid');
        });

        it('should return 200 and clear cookie if no active session or Passport user is found', async () => {
            const mockDestroy = jest.fn();
            const mockClearCookieNoSession = jest.fn();
            
            const app = createTestApp(
                { userId: null, user: null, destroy: mockDestroy }, 
                mockClearCookieNoSession, 
                undefined
            );

            const response = await request(app).get('/api/auth/logout');

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('No active session found, cookie cleared.');
            expect(mockDestroy).not.toHaveBeenCalled();
            expect(mockClearCookieNoSession).toHaveBeenCalledWith('connect.sid');
        });
    });

    // =========================================================================
    // GET /login-fail Tests
    // =========================================================================
    describe('GET /api/auth/login-fail', () => {
        // Create a basic app instance for these tests
        const app = createTestApp({ userId: null, user: null });
        
        it('should redirect to /index.html on login failure with no query param', async () => {
            const response = await request(app).get('/api/auth/login-fail');

            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe('/index.html'); 
        });

        it('should redirect to /index.html with an error query parameter if provided', async () => {
            const errorMessage = 'user_cancelled';
            const response = await request(app).get(`/api/auth/login-fail?error=${errorMessage}`);

            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe(`/index.html?error=${errorMessage}`); 
        });
    });
});