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


# setup crontab
* * * * * sh /var/www/personal-website-node/git-pull.sh 2>&1 | logger -t git-pull-script

- Executes the `git-pull.sh` script.
- Redirects both stdout and stderr from the script to the logger command.
- The logger command then writes these messages to the system log with 
the tag `git-pull-script`.
- we can view the log at `sudo tail -f /var/log/syslog`

# reviewing the logs from the `git-pull-script` (Systemd system)
`sudo journalctl -t git-pull-script`

## continuous monitoring (debian)
`tail -f /var/log/syslog | grep git-pull-script`

### (Red Hat)
`tail -f /var/log/messages | grep git-pull-script`

