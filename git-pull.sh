#! /usr/bin/bash

cd /var/www/personal-website-node/ || { echo "Failed to change directory to /var/www/personal-website-node"; exit 1; }

if git fetch --dry-run 2>/dev/null | grep -q 'origin'; then
    echo "Updates found. Pulling latest changes..."
    if git pull origin main; then
        echo "Successfully pulled latest changes."

        if pm2 restart app; then
            echo "PM2 process restarted."
        else
            echo "Failed to restart pm2 process."
        fi
    else
        echo "Failed to pull latest changes."
    fi
else
    echo "No updates found. PM2 process not restarted."
fi