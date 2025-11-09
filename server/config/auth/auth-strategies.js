/**
 * @file ./server/config/auth/auth-strategies.js
 * @description Centralized map for all available authentication strategies.
 * It dynamically integrates all SSO modes defined in sso-modes.js.
 */

// Centralized map for all SSO operational modes (Mock or Real).
const { SSO_MODE_MAP } = require('./sso-modes');

/**
 * @typedef {Object.<string, string>} StrategyMap
 * @property {string} MOCK - Universal Mock strategy for local development.
 * @property {string} GOOGLE - Google OAuth 2.0 strategy via Passport.
 * @property {string} SSO-MOCK - SSO strategy using mock handlers.
 */
const STRATEGY_MAP = {
    // Mock strategy: Uses mock direct session setup
    'MOCK': '../../services/auth/mock/mock-authenticator',
    
    // Google strategy: Uses Google OAuth 2.0 strategy via Passport
    'GOOGLE': '../../services/auth/google/google-authenticator'
};

// =========================================================================
// DYNAMICALLY GENERATE SSO STRATEGIES
// =========================================================================

// Define the path to the common SSO Factory/Authenticator
const SSO_FACTORY_PATH = '../../services/auth/sso/sso-authenticator';

for (const mode in SSO_MODE_MAP) {
    // Generate the full strategy name (e.g., 'SSO-MOCK')
    const strategyName = `SSO-${mode}`;
    
    // All SSO modes point to the same Factory/Authenticator file
    STRATEGY_MAP[strategyName] = SSO_FACTORY_PATH;
}

module.exports = {
    STRATEGY_MAP
};