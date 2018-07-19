#!/usr/bin/env bash
command -v curl >/dev/null 2>&1 || { echo "You need curl to do this script! Sorry. "; exit 1 ; };
for user in a b c d; do
curl -s -X POST 127.0.0.1/appcs/user/new -d username="$user" -d password="$user" >/dev/null ;
done
echo "users a, b, c, d initialized. Password same as username.";

