// server/tests/middleware/role-checker.test.js

// 1. Declare variables that will hold the mock function and the imported middleware
let mockGetFullUserData;
let requirePermission;

// 2. Use describe to wrap all setup and tests
describe('Authorization Middleware (role-checker)', () => {
    
    // 3. Define the setup hook
    beforeAll(() => {
        // A. Use jest.doMock for dynamic mocking
        jest.doMock('../../server/models/db', () => {
            mockGetFullUserData = jest.fn();
            return {
                getFullUserData: mockGetFullUserData
            };
        });
        
        // B. Manually require the module *after* the mock is set up
        const checker = require('../../server/middleware/role-checker');
        requirePermission = checker.requirePermission;
    });

    // Helper to create mock Express objects (remains the same)
    const createMocks = (userId, permissions) => {
        const req = {
            session: { userId: userId },
            user: { id: userId } // For Passport/Google strategy fallback
        };
        const res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res)
        };
        const next = jest.fn();

        // Mock the DAL call
        if (userId) {
            // FIX: Change Set to Array to align with the desired implementation 
            // and the .includes() method used in the middleware.
            // Note: We use the *already defined* mockGetFullUserData here
            mockGetFullUserData.mockResolvedValue({ permissions: permissions });
        } else {
            mockGetFullUserData.mockResolvedValue(null);
        }

        return { req, res, next };
    };

    beforeEach(() => {
        // Clear all mocks for each test
        jest.clearAllMocks();
    });

    // =========================================================================
    // requirePermission(permissionName)
    // =========================================================================

    describe('requirePermission Middleware', () => {

        test('should call next() for a user with the required permission', async () => {
            // Use the globally set requirePermission
            const { req, res, next } = createMocks(1, ['PROVISION_USERS', 'VIEW_LOGS']);
            const middleware = requirePermission('PROVISION_USERS'); // Now available via beforeAll

            await middleware(req, res, next);
            // ... (assertions remain the same)
            expect(mockGetFullUserData).toHaveBeenCalledWith(1);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });
        
        // ... (rest of the tests)
        test('should return 403 for a user missing the required permission', async () => {
            const { req, res, next } = createMocks(2, ['VIEW_LOGS', 'EDIT_OWN_PROFILE']);
            const middleware = requirePermission('PROVISION_USERS');

            await middleware(req, res, next);

            expect(mockGetFullUserData).toHaveBeenCalledWith(2);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: expect.stringContaining('Access denied. Requires permission: PROVISION_USERS') })
            );
        });

        test('should return 401 if no userId is present in session or req.user', async () => {
            const { req, res, next } = createMocks(null, []); // No user ID
            const middleware = requirePermission('PROVISION_USERS');

            await middleware(req, res, next);

            expect(mockGetFullUserData).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'Authentication required.' })
            );
        });

        test('should return 500 if the DAL call fails', async () => {
            const { req, res, next } = createMocks(3, []);
            mockGetFullUserData.mockRejectedValue(new Error('DB failure')); // Simulate DAL error
            const middleware = requirePermission('PROVISION_USERS');

            await middleware(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'Internal server error during authorization check.' })
            );
        });
    });
});