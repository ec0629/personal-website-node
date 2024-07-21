- `sudo mkdir /var/www`
- change ownership of /var/www
    - `sudo chown -R $USER:$USER /var/www`
- make an application directory
    - `mkdir /var/www/app`
- initialize git repo in `/app`
    - `git init`


1. Copy node files to `/var/www/app`
2. Copy `localhost.conf` to `/etc/nginx/conf.d/`
3. Start Nginx server or reload configs

4. `sudo npm install pm2`
5. `pm2 start app.js`
6. `pm2 save`
7. `pm2 startup`
8. copy output and execute