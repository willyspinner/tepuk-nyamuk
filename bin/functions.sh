#!/usr/bin/env bash

println() {
if [ $1 == 'error' ];
then echo -e "\e[1;41;37m $2 \e[0m"
else
if [ $1 == 'info' ];
then echo -e "\e[0;49;32m $2 \e[0m"
    fi
fi
}


vimrccontents="$( cat <<EOF
execute pathogen#infect()
syntax on
filetype plugin indent on
let g:airline_theme='luna'
set tabstop=4
set shiftwidth=4
set expandtab
EOF
)"

datadogstr="$( cat <<EOF
use_dogstatsd: yes
dogstatsd_port: 8125
EOF
)"

error_exit () {
println 'error' "$1";
}

envnotset="$( cat<<EOF
Please enable the following environment variables to continue setup:
ENABLE_DATADOG : 0 or 1
ENABLE_VIM: 0 or 1
ENABLE_AUTO_NPM_INSTALL: 0 or 1
IS_DOCKER_INSTALLATION: 0 or 1
ENABLE_APP_DB_SETUP: 0 or 1
EOF
)"