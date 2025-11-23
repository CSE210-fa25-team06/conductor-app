/**
 * Backend Permission Constants
 * Loads directly from the JSON file to ensure SSOT.
 */
const permissionsData = require('../data/permissions.json'); // Adjust path to your uploaded file

// Create a map: { VIEW_CLASS_DIRECTORY: "VIEW_CLASS_DIRECTORY", ... }
const PERMISSIONS = {};

permissionsData.permissions.forEach(p => {
    PERMISSIONS[p.name] = p.name;
});

console.log(PERMISSIONS);

module.exports = PERMISSIONS;