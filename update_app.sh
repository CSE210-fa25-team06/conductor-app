#!/bin/bash

# --- Conductor Deployment Update Script ---
#
# This script manages and auto-updates the application
#
# USAGE:
#   ./update_app.sh --install     (Adds the auto-update job to cron)
#   ./update_app.sh --force       (Manually forces a rebuild of the app)
#   ./update_app.sh               (Checks for updates, intended for cron)
#
# ---

# Define the project directory.
APP_DIR=~/conductor-app

# --- Script Actions ---

# Action 1: Install the cron job for auto-updates.
if [[ "$1" == "--install" ]]; then
  echo "Setting up the cron job for auto-updates..."
  
  # The command that will be scheduled to run every 2 minutes.
  CRON_JOB="*/2 * * * * $APP_DIR/update_app.sh >> $APP_DIR/update_app.log 2>&1"
  
  # This check prevents adding the same job multiple times.
  if ! crontab -l | grep -q "update_app.sh"; then
    # This command adds the new job to the crontab without deleting existing ones.
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "Cron job installed successfully."
  else
    echo "Cron job already exists."
  fi
  exit 0
fi

# Move into the project directory. The script will exit if this fails.
cd "$APP_DIR" || exit

# Action 2: Force a manual rebuild.
if [[ "$1" == "--force" ]]; then
  echo "Forcing a manual rebuild..."
  docker compose -f docker-compose.yml -f docker-compose.override.yml up --build -d
  echo "Rebuild complete."
  exit 0
fi

# Default Action: Check for updates automatically.
git checkout main
git fetch

# If our local code is behind the remote repo, pull the changes and rebuild.
if [[ $(git status -uno) == *"Your branch is behind"* ]]; then
  echo "New changes found. Pulling and rebuilding..."
  git pull origin main
  docker compose -f docker-compose.yml -f docker-compose.override.yml up --build -d
  echo "Update finished."
else
  echo "No new changes."
fi
