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

        # should short circuit if the git pull script was updated

        NEW_NGINX_MD5=$(md5sum jeffsimonitto.com.conf | awk '{ print $1 }')
        OLD_NGINX_MD5=$(md5sum /etc/nginx/conf.d/jeffsimonitto.com.conf | awk '{ print $1 }')

        if [ "$NEW_NGINX_MD5" != "$OLD_NGINX_MD5" ]; then
            echo "nginx.conf has changed. Manual deployment needed."
            exit 1
        else
            echo "nginx.conf has not changed. Continuing..."
        fi

        echo "Installing npm dependencies..."
        if npm install; then
            echo "npm dependencies installed."

            if pm2 restart app; then
                echo "PM2 process restarted."
            else
                echo "Failed to restart pm2 process."
            fi
        else
            echo "Failed to install npm dependencies."
        fi
    else
        echo "Failed to pull latest changes."
    fi
else
    echo "No updates found. PM2 process not restarted."
fi