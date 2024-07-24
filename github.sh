#! /usr/bin/bash

cd /var/www/personal-website-node/ || { logger -t git-pull-script "Failed to change directory to /var/www/personal-website-node"; exit 1; }

if git fetch --dry-run 2>/dev/null | grep -q 'origin'; then
    logger -t git-pull-script "Updates found. Pulling latest changes..."
    if git pull origin main; then
        logger -t git-pull-script "Successfully pulled latest changes."

        if pm2 restart app; then
            logger -t git-pull-script "PM2 process restarted."
        else
            logger -t git-pull-script "Failed to restart pm2 process."
        fi
    else
        logger -t git-pull-script "Failed to pull latest changes."
    fi
else
    logger -t git-pull-script "No updates found. PM2 process not restarted."
fi
git pull origin main