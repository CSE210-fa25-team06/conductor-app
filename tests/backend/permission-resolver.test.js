// server/tests/unit/permission-resolver.test.js

const { resolveUserPermissions } = require('../../server/utils/permission-resolver');

// Helper function to map permission objects to an array of strings
const getPermissionNames = (role) => role.permissions.map(p => p.name);


const mockRoles = {
    // Unprivileged (Level <= 1)
    GUEST: {
        name: 'Guest', privilege_level: 0,
        permissions: [{ id: 1, name: 'VIEW_FAQ_SYSTEM' }, { id: 2, name: 'VIEW_DOCS_MANAGER' }]
    },
    STUDENT: {
        name: 'Student', privilege_level: 1,
        permissions: [
            { id: 3, name: 'EDIT_OWN_PROFILE_DATA' }, 
            { id: 4, name: 'USER_SUBMIT_JOURNAL' }, 
            { id: 5, name: 'VIEW_OWN_JOURNAL_SENTIMENT' },
            { id: 6, name: 'VIEW_OWN_ATTENDANCE_REPORTS' }, 
            { id: 7, name: 'VIEW_DEFINITION_OF_DONE' }, 
            { id: 1, name: 'VIEW_FAQ_SYSTEM' }, 
            { id: 2, name: 'VIEW_DOCS_MANAGER' }
        ]
    },
    GROUP_LEADER: {
        name: 'Group Leader', privilege_level: 1,
        permissions: [
            { id: 8, name: 'GROUP_MANAGE_ATTENDANCE' }, 
            { id: 9, name: 'MANAGE_GROUP_FILES' }, 
            { id: 10, name: 'VIEW_OWN_GROUP_JOURNALS' },
            { id: 11, name: 'VIEW_CLASS_DIRECTORY' }, 
            { id: 1, name: 'VIEW_FAQ_SYSTEM' }, 
            { id: 2, name: 'VIEW_DOCS_MANAGER' }
        ]
    },
    // Privileged (Level > 1)
    TUTOR: {
        name: 'Tutor', privilege_level: 5,
        permissions: [
            { id: 10, name: 'VIEW_OWN_GROUP_JOURNALS' }, 
            { id: 11, name: 'VIEW_CLASS_DIRECTORY' }, 
            { id: 12, name: 'MANAGE_LAB_QUEUE' },
            { id: 13, name: 'PROMOTE_TO_FAQ' }, 
            { id: 14, name: 'SUBMIT_NEGATIVE_INTERACTION' }, 
            { id: 15, name: 'SUBMIT_LAB_OBSERVATIONS' },
            { id: 1, name: 'VIEW_FAQ_SYSTEM' }, 
            { id: 2, name: 'VIEW_DOCS_MANAGER' }
        ]
    },
    TA: {
        name: 'TA', privilege_level: 50,
        permissions: [
            { id: 16, name: 'ASSIGN_GROUPS' }, 
            { id: 17, name: 'MANAGE_ALL_ATTENDANCE' }, 
            { id: 18, name: 'VIEW_ALL_ATTENDANCE_REPORTS' },
            { id: 19, name: 'VIEW_ALL_JOURNALS' }, 
            { id: 20, name: 'EDIT_ALL_JOURNALS' }, 
            { id: 21, name: 'MANAGE_DOCS_MANAGER' }, 
            { id: 22, name: 'MANAGE_DEFINITION_OF_DONE' },
            { id: 1, name: 'VIEW_FAQ_SYSTEM' }, 
            { id: 2, name: 'VIEW_DOCS_MANAGER' }
        ]
    },
    PROFESSOR: {
        name: 'Professor', privilege_level: 100,
        permissions: [
            { id: 23, name: 'MANAGE_SYSTEM_CONFIG' }, 
            { id: 24, name: 'PROVISION_USERS' }, 
            { id: 25, name: 'VIEW_LOGS' }, 
            { id: 26, name: 'MANAGE_ROLES' },
            { id: 27, name: 'EDIT_ALL_PROFILE_DATA' }, 
            { id: 28, name: 'VIEW_REPORTING_ENGINE' }, 
            { id: 1, name: 'VIEW_FAQ_SYSTEM' }, 
            { id: 2, name: 'VIEW_DOCS_MANAGER' }
        ]
    }
};

// Helper to convert Set to a sorted Array for reliable comparison
const setToArray = (set) => Array.from(set).sort();

describe('Permission Resolver - Exhaustive Test Suite', () => {

    // --- Category A: Edge Cases and Single Roles ---
    
    test('A1: Empty roles array should return Guest with no permissions', () => {
        const roles = [];
        const result = resolveUserPermissions(roles);
        expect(result.effectiveRoleName).toBe('Guest');
        expect(result.permissions.size).toBe(0);
    });

    test('A2: Single Unprivileged Role (Level 0)', () => {
        const roles = [mockRoles.GUEST];
        const result = resolveUserPermissions(roles);

        const expectedPermissions = new Set(getPermissionNames(mockRoles.GUEST));
        expect(result.effectiveRoleName).toBe('Guest');
        expect(setToArray(result.permissions)).toEqual(setToArray(expectedPermissions));
    });

    test('A3: Single Unprivileged Role (Level 1)', () => {
        const roles = [mockRoles.STUDENT];
        const result = resolveUserPermissions(roles);

        const expectedPermissions = new Set(getPermissionNames(mockRoles.STUDENT));
        expect(result.effectiveRoleName).toBe('Student');
        expect(setToArray(result.permissions)).toEqual(setToArray(expectedPermissions));
    });

    test('A4: Single Privileged Role (Level 100)', () => {
        const roles = [mockRoles.PROFESSOR];
        const result = resolveUserPermissions(roles);

        const expectedPermissions = new Set(getPermissionNames(mockRoles.PROFESSOR));
        expect(result.effectiveRoleName).toBe('Professor');
        expect(setToArray(result.permissions)).toEqual(setToArray(expectedPermissions));
    });


    // --- Category B: Unprivileged Stacking (Rule 1: All roles <= 1) ---
    
    test('B1: Two roles at Level 1 should stack permissions (Student + Group Leader)', () => {
        const roles = [mockRoles.STUDENT, mockRoles.GROUP_LEADER];

        const result = resolveUserPermissions(roles);
        
        // Expected: Union of Student and Group Leader permissions
        const expectedPermissions = new Set([
            ...getPermissionNames(mockRoles.STUDENT), 
            ...getPermissionNames(mockRoles.GROUP_LEADER)
        ]);

        expect(result.effectiveRoleName).toBe('Student, Group Leader'); // Should list all role names
        expect(setToArray(result.permissions)).toEqual(setToArray(expectedPermissions));
        expect(result.permissions.has('GROUP_MANAGE_ATTENDANCE')).toBe(true); // From Group Leader
        expect(result.permissions.has('USER_SUBMIT_JOURNAL')).toBe(true); // From Student
    });

    test('B2: Stacking Level 0 and Level 1 roles (Guest + Student)', () => {
        const roles = [mockRoles.GUEST, mockRoles.STUDENT];

        const result = resolveUserPermissions(roles);
        const expectedPermissions = new Set(getPermissionNames(mockRoles.GUEST));

        expect(result.effectiveRoleName).toBe('Guest');
        expect(setToArray(result.permissions)).toEqual(setToArray(expectedPermissions));
    });

    // --- Category C: Least-Privileged Override (Rule 2: Any role > 1) ---
    // The implementation selects the least privileged role among the privileged roles only.

    test('C1: Mixed Privileged Levels (Tutor 05 + Professor 100)', () => {
        // Least Privileged of the PRIVILEGED group is TUTOR (05)
        const roles = [mockRoles.PROFESSOR, mockRoles.TUTOR];

        const result = resolveUserPermissions(roles);
        
        // Expected: ONLY Tutor's permissions
        const expectedPermissions = new Set(getPermissionNames(mockRoles.TUTOR));

        expect(result.effectiveRoleName).toBe('Tutor');
        expect(setToArray(result.permissions)).toEqual(setToArray(expectedPermissions));
        expect(result.permissions.has('MANAGE_LAB_QUEUE')).toBe(true);
        expect(result.permissions.has('PROVISION_USERS')).toBe(false);
    });
    
    // --- Category D: Privileged Role Override on Unprivileged Roles ---
    
    test('D1: Privileged Role (Professor 100) and Unprivileged Role (Student 1)', () => {
        // The resolver identifies the lowest level (Student, level 1). It stacks all roles at level 1.
        const roles = [mockRoles.STUDENT, mockRoles.PROFESSOR];

        const result = resolveUserPermissions(roles);
        
        // Expected: ONLY Student's permissions (Lowest level is 1)
        const expectedPermissions = new Set(getPermissionNames(mockRoles.STUDENT));

        expect(result.effectiveRoleName).toBe('Student'); 
        expect(setToArray(result.permissions)).toEqual(setToArray(expectedPermissions));
        expect(result.permissions.has('PROVISION_USERS')).toBe(false); // Professor perm
        expect(result.permissions.has('USER_SUBMIT_JOURNAL')).toBe(true); // Student perm
    });
    
    test('D2: All Three Categories Present (Student 1 + Tutor 05 + Professor 100)', () => {
        // The resolver identifies the lowest level (Student, level 1).
        const roles = [mockRoles.STUDENT, mockRoles.PROFESSOR, mockRoles.TUTOR];

        const result = resolveUserPermissions(roles);
        
        // Expected: ONLY Student's permissions (Lowest level is 1)
        const expectedPermissions = new Set(getPermissionNames(mockRoles.STUDENT));

        expect(result.effectiveRoleName).toBe('Student');
        expect(setToArray(result.permissions)).toEqual(setToArray(expectedPermissions));
        expect(result.permissions.has('MANAGE_LAB_QUEUE')).toBe(false); // Tutor perm
        expect(result.permissions.has('USER_SUBMIT_JOURNAL')).toBe(true); // Student perm
        expect(result.permissions.has('PROVISION_USERS')).toBe(false); // Professor perm
    });
});