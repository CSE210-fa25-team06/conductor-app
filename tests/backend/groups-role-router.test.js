const request = require('supertest');
const express = require('express');

jest.mock('../../server/models/db');

jest.mock('../../server/middleware/role-checker', () => ({
  requirePermission: jest.fn(() => (req, res, next) => next())
}));

const groupsRolesRouter = require('../../server/routes/api/admin/groups-roles-router'); 
const db = require('../../server/models/db');
const roleChecker = require('../../server/middleware/role-checker');

const app = express();
app.use(express.json());
app.use('/api/admin', groupsRolesRouter);

describe('Groups Roles Router', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();

    roleChecker.requirePermission.mockImplementation(() => (req, res, next) => next());
  });

  describe('POST /api/admin/groups', () => {
    it('should create a group and return 201', async () => {
      const mockGroup = { name: 'Test Group', logoUrl: 'http://logo.com' };
      db.createGroup.mockResolvedValue(10);

      const res = await request(app)
        .post('/api/admin/groups')
        .send(mockGroup);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.id).toBe(10);
      expect(db.createGroup).toHaveBeenCalledWith('Test Group', 'http://logo.com', undefined, undefined);
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).post('/api/admin/groups').send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Group name is required.');
    });

    it('should return 409 if group name already exists', async () => {
      const error = new Error('Unique constraint');
      error.code = '23505';
      db.createGroup.mockRejectedValue(error);

      const res = await request(app)
        .post('/api/admin/groups')
        .send({ name: 'Duplicate Group' });

      expect(res.statusCode).toEqual(409);
      expect(res.body.error).toContain('already exists');
    });

    it('should return 500 on generic server error', async () => {
      db.createGroup.mockRejectedValue(new Error('DB connection failed'));

      const res = await request(app)
        .post('/api/admin/groups')
        .send({ name: 'Group' });

      expect(res.statusCode).toEqual(500);
    });
  });

  describe('POST /api/admin/roles', () => {
    it('should create a role and return 201', async () => {
      db.createRole.mockResolvedValue(5);
      
      const res = await request(app)
        .post('/api/admin/roles')
        .send({ name: 'Admin', privilege_level: 1 });

      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toBe(5);
      expect(db.createRole).toHaveBeenCalledWith('Admin', 1);
    });

    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/admin/roles')
        .send({ name: 'No Level' });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/admin/permissions', () => {
    it('should create a permission and return 201', async () => {
      db.createPermission.mockResolvedValue(99);

      const res = await request(app)
        .post('/api/admin/permissions')
        .send({ name: 'READ_ALL', description: 'Can read everything' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toBe(99);
    });

    it('should return 409 if permission already exists', async () => {
      const error = new Error('Unique violation');
      error.code = '23505';
      db.createPermission.mockRejectedValue(error);

      const res = await request(app)
        .post('/api/admin/permissions')
        .send({ name: 'EXISTING', description: 'desc' });

      expect(res.statusCode).toEqual(409);
    });
  });

  describe('PUT /api/admin/roles/:roleId/permissions', () => {
    it('should update role permissions and return 200', async () => {
      db.setRolePermissions.mockResolvedValue();

      const res = await request(app)
        .put('/api/admin/roles/1/permissions')
        .send({ permissionNames: ['READ', 'WRITE'] });

      expect(res.statusCode).toEqual(200);
      expect(db.setRolePermissions).toHaveBeenCalledWith(1, ['READ', 'WRITE']);
    });

    it('should return 400 for invalid inputs', async () => {
      const res = await request(app)
        .put('/api/admin/roles/abc/permissions')
        .send({ permissionNames: [] });

      expect(res.statusCode).toEqual(400);
    });

    it('should return 404 if role or permissions not found (caught from DB logic)', async () => {
      db.setRolePermissions.mockRejectedValue(new Error('Permission name not found'));

      const res = await request(app)
        .put('/api/admin/roles/1/permissions')
        .send({ permissionNames: ['BAD_PERM'] });

      expect(res.statusCode).toEqual(404);
    });
  });
});