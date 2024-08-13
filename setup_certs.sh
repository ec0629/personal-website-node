mkdir bin/certs

openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 -keyout bin/certs/key.pem -out bin/certs/cert.pem