/**
 * @file server/app.js
 * @description Main entry point for the Conductor Express API server.
 * It initializes Express, configures middleware (JSON parsing, session management),
 * loads environment variables, mounts the authentication router, and starts the server.
 */

// Core Libraries
const express = require('express');
const session = require('express-session'); 
const path = require('path');

// Routers
const authRouter = require('./middleware/auth'); 

// Configuration
// Load environment variables from the project root .env file.
// Path is resolved relative to the current file (server/) up one directory (..).
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 3000;


// =========================================================================
// MIDDLEWARE CONFIGURATION
// =========================================================================

// Middleware to parse incoming JSON request bodies.
app.use(express.json());

// Configure and enable express-session middleware for user sessions.
app.use(session({
  // Secret used to sign the session ID cookie. MUST be set via environment variable.
  secret: process.env.SESSION_SECRET, 
  // Do not save session if it was not modified during the request.
  resave: false,
  // Do not create session for uninitialized requests.
  saveUninitialized: false, 
  cookie: {
    // Set to true in production with HTTPS for security.
    secure: process.env.NODE_ENV === 'production', 
    // Session expiration time (e.g., 24 hours).
    maxAge: 1000 * 60 * 60 * 24 
  }
}));

// =========================================================================
// ROUTE REGISTRATION
// =========================================================================

// Mount the authentication router for all /api/auth/* routes.
app.use('/api/auth', authRouter);

// Basic health check/home route.
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
  console.log(`Server listening at ${process.env.SERVER_HOST}:${port}`);
});