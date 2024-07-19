1. Copy node files to `/var/www/app`
2. Copy `localhost.conf` to `/etc/nginx/conf.d/`
3. Start Nginx server or reload configs

4. `sudo npm install pm2`
5. `pm2 start app.js`
6. `pm2 save`
7. `pm2 startup`
8. copy output and execute