const express = require('express');
const router = express.Router();

// 1. Load the Raw Data (The Array)
let rawData = {};
try {
    // Adjust path if necessary to point to your JSON file
    rawData = require('../../config/data/permissions.json');
} catch (err) {
    console.error("[CONFIG-ROUTER] Failed to load raw permissions JSON:", err.message);
}

// 2. Create the Map (The Transformation)
// We turn the Array [...] into an Object { "PERM_NAME": "PERM_NAME" }
const PERMISSIONS_MAP = {};

if (rawData.permissions && Array.isArray(rawData.permissions)) {
    rawData.permissions.forEach(perm => {
        // This creates the key-value pair
        PERMISSIONS_MAP[perm.name] = perm.name; 
    });
}

/**
 * GET /api/config/js/permissions.js
 * Serves the FLATTENED map to the frontend
 */
router.get('/js/permissions.js', (req, res) => {
    const fileContent = `
        /**
         * AUTO-GENERATED PERMISSION CONSTANTS
         * Flattened for direct access (e.g., PERMISSIONS.VIEW_CLASS_DIRECTORY)
         */
        export const PERMISSIONS = ${JSON.stringify(PERMISSIONS_MAP, null, 2)};
    `;
    
    res.setHeader('Content-Type', 'application/javascript');
    res.send(fileContent);
});

module.exports = router;