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
const usersRouter = require('./routes/users');
const journalRouter = require('./routes/journals');
const sentimentRouter = require('./routes/sentiments');
const groupsRouter = require('./routes/groups');
const attendanceRouter = require('./routes/attendance');
const authRouter = require('./routes/api/auth/auth-router');
const groupsRolesRouter = require('./routes/api/admin/groups-roles-router');
const userRoleRouter = require('./routes/api/admin/user-role-router');
const configRouter = require('./routes/api/config-router');

// Configuration
// Load environment variables from the project root .env file.
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
// Melvyn Testing HTML Linter KEEP FOR NOW
// require('dotenv').config({
//   path: path.resolve(__dirname, '../../../', '.env'),
//   override: false  // prevents overwriting existing env vars (important!)
// });
// --- End of tests ----

// --- FIX START: GLOBAL PASSPORT SERIALIZATION ---
// These must be defined regardless of the strategy (Google, Mock, etc.)
// otherwise app.use(passport.session()) will fail if it tries to handle a user.

/**
 * Serializer: Stores only the user's database ID in the session.
 */
passport.serializeUser((userId, done) => {
    done(null, userId);
});

/**
 * Deserializer: Uses the ID from the session to retrieve the user object/ID.
 */
passport.deserializeUser(async (userId, done) => {
    // Currently returns only the ID, relying on /session or separate API calls to fetch full data.
    done(null, userId); 
});
// --- FIX END ---



// Load the Google Authenticator module to initialize the Passport Strategy
// This ensures passport.use(new GoogleStrategy(...)) runs.
// Only load Google OAuth strategy when actually needed
if (process.env.AUTH_STRATEGY === 'GOOGLE') {
  require('./services/auth/google/google-authenticator');
} else {
  console.log("[AUTH] Google strategy disabled for this environment");
}

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
app.use('/users', usersRouter);            // enables class directory
app.use('/journals', journalRouter);      // enables journal posting
app.use('/sentiments', sentimentRouter);  // enables sentiment tracking
app.use('/groups', groupsRouter);          // enables group fetching
app.use('/attendance', attendanceRouter);  // enables attendance routes
// Mount the authentication router for all /api/auth/* routes.
app.use('/api/auth', authRouter);
app.use('/api/admin', groupsRolesRouter); 
app.use('/api/admin', userRoleRouter); // <-- NEW MOUNT
app.use('/api/config', configRouter);

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
