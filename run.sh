#!/bin/bash
yarn

yarn build

gpg -v --batch --pinentry-mode loopback --command-fd 0 --passphrase-file ./mypassphrase.txt --import /app/dist/example/keys/public_key.txt

gpg -v --batch --pinentry-mode loopback --command-fd 0 --passphrase-file ./mypassphrase.txt --import /app/dist/example/keys/private_key.txt