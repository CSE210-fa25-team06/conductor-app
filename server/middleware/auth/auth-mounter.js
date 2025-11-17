/**
 * @file server/middleware/auth/auth-mounter.js
 * @description Dynamically loads and mounts the routes for the selected authentication strategy.
 * It uses the factory pattern to handle complex strategies like SSO.
 */

const express = require('express');
const path = require('path');
// Import configuration maps
const { STRATEGY_MAP } = require('../../config/auth/auth-strategies'); 
const { SSO_MODE_MAP } = require('../../config/auth/sso-modes');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../../', '.env') }); 
// Melvyn Testing HTML Linter KEEP FOR NOW
// require('dotenv').config({
//   path: path.resolve(__dirname, '../../../', '.env'),
//   override: false
// });
const ACTIVE_STRATEGY = process.env.AUTH_STRATEGY;
// // Detect CI
// const IS_CI = process.env.CI === 'true';

// // In CI we **always** force MOCK to avoid Google OAuth and secrets
// let ACTIVE_STRATEGY;
// if (IS_CI) {
//   ACTIVE_STRATEGY = 'MOCK';
// } else {
//   ACTIVE_STRATEGY = process.env.AUTH_STRATEGY || 'GOOGLE';
// }

// console.log('[AUTH-MOUNTER] process.env.CI =', process.env.CI);
// console.log('[AUTH-MOUNTER] process.env.AUTH_STRATEGY =', process.env.AUTH_STRATEGY);
// --- End of tests ----
console.log(`[AUTH-MOUNTER] Configured Strategy: ${ACTIVE_STRATEGY}`);

/**
 * Loads and mounts the Express router for the selected authentication strategy.
 * * @returns {express.Router} An Express Router containing the strategy-specific routes.
 */
function loadAuthStrategyRoutes() {
    const router = express.Router();

    const modulePath = STRATEGY_MAP[ACTIVE_STRATEGY];

    if (!modulePath) {
        console.error(`[AUTH-MOUNTER] ERROR: Unknown AUTH_STRATEGY: ${ACTIVE_STRATEGY}. Login routes will be empty.`);
        return router;
    }

    try {
        const authModule = require(modulePath); 
        let finalRouter = authModule.router; // Default export for simple strategies (like MOCK or GOOGLE)

        // =========================================================================
        // SPECIAL HANDLING: Check if the module is the SSO factory
        // =========================================================================
        if (authModule.createSsoRouter) {
            
            // 1. Determine the mode (e.g., 'SSO-MOCK' -> 'MOCK')
            const modeName = ACTIVE_STRATEGY.split('-').pop(); 
            
            // 2. Look up the specific handler module path
            const handlerModulePath = SSO_MODE_MAP[modeName];
            
            if (!handlerModulePath) {
                console.error(`[AUTH-MOUNTER] ERROR: SSO mode handler not found for mode: ${modeName}`);
                return router;
            }

            // 3. Load the specific handlers (Mock or Real)
            const handlers = require(handlerModulePath);
            
            // 4. Instantiate the router using the factory pattern
            finalRouter = authModule.createSsoRouter(handlers, modeName);
        }
        
        // 5. Mount the resulting router
        router.use(finalRouter);
        
    } catch (error) {
        console.error(`[AUTH-MOUNTER] ERROR: Failed to load authentication module:`, error.message);
    }
    
    return router;
}

module.exports = loadAuthStrategyRoutes;