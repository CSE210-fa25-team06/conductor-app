/**
 * @file server/app.js
 * @description Main entry point for the Conductor Express API server.
 * Initializes Express, configures middleware (JSON parsing, session, Passport),
 * loads environment variables, mounts the authentication router, and starts the server.
 */

// Core Libraries
const express = require('express');
const session = require('express-session');
const passport = require('passport'); 
const path = require('path');

// Routers
const authRouter = require('./routes/api/auth/auth-router');

// Journal
const journalRouter = require('./routes/journals');

// Configuration
// Load environment variables from the project root .env file.
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Load the Google Authenticator module to initialize the Passport Strategy
// This ensures passport.use(new GoogleStrategy(...)) runs.
require('./services/auth/google/google-authenticator');

const app = express();
const port = process.env.PORT || 3000;

// =========================================================================
// MIDDLEWARE CONFIGURATION
// =========================================================================

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

/**
 * Express-Session Middleware Configuration.
 */
app.use(session({
  // Secret used to sign the session ID cookie. MUST be secure.
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false, 
  cookie: {
    // Set to true in production with HTTPS for security.
    secure: process.env.NODE_ENV === 'production', 
    // Session expiration time (e.g., 24 hours).
    maxAge: 1000 * 60 * 60 * 24 
  }
}));

// === Passport Middleware (Required for Google Strategy) ===

/**
 * Initializes Passport for use in the application.
 */
app.use(passport.initialize()); 

/**
 * Links Passport's authentication state to the existing Express session.
 */
app.use(passport.session()); 

// =========================================================================
// ROUTE REGISTRATION
// =========================================================================

// Mount the authentication router for all /api/auth/* routes.
app.use('/api/auth', authRouter);
app.use('/journal', journalRouter);

/**
 * GET /
 * Basic health check/home route.
 */
app.get('/', (req, res) => {
  res.send('Conductor API is running.');
});

// =========================================================================
// SERVER START
// =========================================================================

/**
 * Starts the Express server and listens on the configured port.
 */
app.listen(port, () => {
  const host = process.env.SERVER_HOST || '127.0.0.1'; // Define host here, with a safe fallback
  console.log(`Conductor API Server listening at http://${host}:${port}`);
});