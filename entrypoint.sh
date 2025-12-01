#!/bin/sh
# This script runs database setup commands before starting the main application.

# Exit immediately if a command fails.
set -e

# Run the database seeder.
echo "Running database seeder..."
node server/utils/db-seeder.js
echo "Seeder finished."

# Execute the main command passed to the container
exec "$@"