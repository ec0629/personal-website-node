#! /usr/bin/bash

cd /var/www/personal-website-node/ || { echo "Failed to change directory to /var/www/personal-website-node"; exit 1; }

echo "Checking for new commits..."
git fetch

LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL != $REMOTE ]; then
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