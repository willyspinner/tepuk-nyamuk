#!/usr/bin/env bash
command -v curl >/dev/null 2>&1 || { echo "You need curl to do this script! Sorry. "; exit 1 ; };
for user in a b c d; do
curl  -X POST 127.0.0.1:3000/appcs/user/new -d username="$user" -d password="$user" >/dev/null  || { echo "failed. Is the appcs server online?"; exit 1; }
done
echo "users a, b, c, d initialized. Password same as username.";

