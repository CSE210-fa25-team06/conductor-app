const request = require('supertest');
const express = require('express');

// Mock Dependencies
jest.mock('../../server/models/db');

// We must mock the utils file because the router imports a constant from it.
jest.mock('../../server/utils/permission-resolver', () => ({
  UNPRIVILEGED_THRESHOLD: 1
}));

jest.mock('../../server/middleware/role-checker', () => ({
  requirePermission: jest.fn(() => (req, res, next) => next())
}));

const userRoleRouter = require('../../server/routes/api/admin/user-role-router');
const db = require('../../server/models/db');
const roleChecker = require('../../server/middleware/role-checker');

const app = express();
app.use(express.json());
app.use('/api/admin', userRoleRouter);

describe('User Role Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Allow middleware to pass
    roleChecker.requirePermission.mockImplementation(() => (req, res, next) => next());
  });

  describe('PUT /api/admin/users/:userId/roles', () => {
    
    it('should successfully assign roles when rules are met', async () => {
      // Setup: All roles are unprivileged (level 2 > threshold 1)
      db.getRolePrivilegeLevel.mockImplementation(async (id) => {
        if (id === 10) return 2;
        if (id === 11) return 2;
        return 99;
      });
      db.assignRolesToUser.mockResolvedValue(true);

      const res = await request(app)
        .put('/api/admin/users/123/roles')
        .send({ roleIds: [10, 11] });

      expect(res.statusCode).toEqual(200);
      expect(db.assignRolesToUser).toHaveBeenCalledWith(123, [10, 11]);
    });

    it('should return 403 (Security Violation) if assigning > 1 privileged role', async () => {
      // Setup: 1 is privileged (level 1 <= threshold 1)
      // We try to assign two roles that both have level 1
      db.getRolePrivilegeLevel.mockImplementation(async (id) => {
        return 1; // Always return level 1 (privileged)
      });

      const res = await request(app)
        .put('/api/admin/users/123/roles')
        .send({ roleIds: [5, 6] }); // Two privileged roles

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toContain('Cannot assign a user more than one privileged role');
      expect(db.assignRolesToUser).not.toHaveBeenCalled();
    });

    it('should return 400 (Assignment Violation) if roles have different privilege levels', async () => {
      // Setup: ID 10 is level 2, ID 20 is level 5
      db.getRolePrivilegeLevel.mockImplementation(async (id) => {
        if (id === 10) return 2;
        if (id === 20) return 5;
        return 99;
      });

      const res = await request(app)
        .put('/api/admin/users/123/roles')
        .send({ roleIds: [10, 20] });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('Roles must all be assigned at the same privilege level');
    });

    it('should allow exactly one privileged role', async () => {
        // Setup: ID 1 is level 1 (privileged), only assigning one
        db.getRolePrivilegeLevel.mockResolvedValue(1);
        db.assignRolesToUser.mockResolvedValue(true);
  
        const res = await request(app)
          .put('/api/admin/users/123/roles')
          .send({ roleIds: [1] });
  
        expect(res.statusCode).toEqual(200);
    });

    it('should return 400 for invalid inputs', async () => {
      const res = await request(app)
        .put('/api/admin/users/not-a-number/roles')
        .send({ roleIds: [1] });

      expect(res.statusCode).toEqual(400);
    });

    it('should handle DB errors gracefully', async () => {
      db.getRolePrivilegeLevel.mockResolvedValue(2);
      db.assignRolesToUser.mockRejectedValue(new Error('DB Failure'));

      const res = await request(app)
        .put('/api/admin/users/123/roles')
        .send({ roleIds: [10] });

      expect(res.statusCode).toEqual(500);
    });
  });
});