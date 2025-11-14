/**
 * @file server/config/auth/sso-modes.js
 * @description Centralized map for all SSO operational modes (Mock or Real).
 * Defines the path to the concrete handler module for each mode.
 */

/**
 * @typedef {Object.<string, string>} SsoModeMap
 * @property {string} MOCK - Path to the mock implementation of the SSO handlers.
 */

const SSO_MODE_MAP = {
    // [Mode Name (from .env)]: [Relative Path from sso-authenticator.js to the Mode Handler]
    'MOCK': '../../services/auth/sso/handlers/mock-sso-handler',
    // Add 'REAL' here when the concrete handler is implemented
};

module.exports = {
    SSO_MODE_MAP
};