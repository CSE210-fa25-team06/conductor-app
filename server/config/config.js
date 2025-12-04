/* ==== GLOBAL CONFIG FILE=== */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../', '.env') });
const config = {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
    PORT: process.env.PORT || 3000
};

module.exports = config;