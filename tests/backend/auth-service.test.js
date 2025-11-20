// auth-service.test.js

// Use 'var' instead of 'const' so the declarations are hoisted
// and accessible within the hoisted jest.mock() call.
var mockGetFullUserData = jest.fn();
var mockLogSuccessfulLogin = jest.fn();

// Mock the entire db.js module
jest.mock('../../server/models/db', () => ({
    getFullUserData: mockGetFullUserData,
    logSuccessfulLogin: mockLogSuccessfulLogin,
}));

describe('Auth Service Layer (handleUserLogin)', () => {
    
    const { handleUserLogin } = require('../../server/services/auth/auth-service'); 
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockUserId = 1;
    const mockIpAddress = '192.168.1.1';
    const mockUserData = { id: mockUserId, email: 'test@example.com', permissions: new Set() };

    test('should call DAL functions and log successful login', async () => {

        mockGetFullUserData.mockResolvedValue(mockUserData);

        const result = await handleUserLogin(mockUserId, mockIpAddress);

        expect(mockGetFullUserData).toHaveBeenCalledWith(mockUserId, mockIpAddress);
        expect(mockLogSuccessfulLogin).toHaveBeenCalledWith(mockUserId, mockIpAddress);
        expect(result).toEqual(mockUserData);
    });

    test('should NOT call logSuccessfulLogin if user data is null', async () => {
        mockGetFullUserData.mockResolvedValue(null);

        const result = await handleUserLogin(mockUserId, mockIpAddress);

        expect(mockGetFullUserData).toHaveBeenCalledTimes(1);
        expect(mockLogSuccessfulLogin).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    test('should throw an error if getFullUserData fails', async () => {
        const mockError = new Error('DB connection failed');
        mockGetFullUserData.mockRejectedValue(mockError);


        await expect(handleUserLogin(mockUserId, mockIpAddress)).rejects.toThrow('DB connection failed');
        expect(mockLogSuccessfulLogin).not.toHaveBeenCalled();
    });
});