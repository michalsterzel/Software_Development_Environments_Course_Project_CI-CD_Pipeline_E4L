#!/bin/bash
sed -i -e "s@PUBLIC_PATH@$PUBLIC_PATH@g" /usr/share/nginx/html/js/main.js
sed -i -e "s@PUBLIC_PATH@$PUBLIC_PATH@g" /usr/share/nginx/html/index.html
nginx -g 'daemon off;'
