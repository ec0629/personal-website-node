#! /usr/bin/bash

# needs more robust logging like the deployment script
cp ./jeffsimonitto.com.conf /etc/nginx/conf.d/

systemctl reload nginx