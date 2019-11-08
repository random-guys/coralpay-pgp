#!/bin/bash
touch mypassphrase.txt
touch private_key.txt
touch public_key.txt

echo $PASSPHRASE > mypassphrase.txt
echo $PUBLIC_KEY  | base64 -d > public_key.txt
echo $PRIVATE_KEY | base64 -d > private_key.txt

gpg -v --batch --pinentry-mode loopback --command-fd 0 --passphrase-file ./mypassphrase.txt --import ./public_key.txt

gpg -v --batch --pinentry-mode loopback --command-fd 0 --passphrase-file ./mypassphrase.txt --import ./private_key.txt

rm -f public_key.txt
rm -f private_key.txt
rm -f mypassphrase.txt