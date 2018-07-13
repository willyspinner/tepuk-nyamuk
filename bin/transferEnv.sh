#!/usr/bin/env bash

# run from your local computer

USAGE="$( cat<<EOF
transferEnv.sh transfers *.env environment files to a remote tepuk-nyamuk location securely using scp.
Usage:
 $   ./transferKeys.sh <PRIVATE_KEY> <TEPUK_NYAMUK_LOCAL_BASE_DIR> <username@REMOTE_HOST:TEPUKNYAMUK_REMOTE_BASE_DIR>
where:
    - TEPUKNYAMUK_BASE_DIR is the base tepuk-nyamuk directory.
    - PATH is the path of the local directory from which you want to copy
)"
# $1 is private key
# $2 is local base dir
# $3 is remote location

if [ $# -lt 3 ] ;
then echo "$USAGE";
exit 1;
fi


find "$2" -name '.*.env' | while read file;
do
TRUNCFILE="$(echo $file | sed -e 's:^\.*\/:\/:g')"
echo "TRUNCFILE= $TRUNCFILE"
echo "$(dirname "$TRUNCFILE")"
 echo "transferring $file to : $3$(dirname "$TRUNCFILE")";
 scp -i "$1" "$file" "$3$(dirname "$TRUNCFILE")"

 done
