#!/usr/bin/env bash

println() {
if [ $1 == 'error' ];
then echo -e "\e[1;41;37m $2 \e[0m"
else
if [ $! == 'info' ];
then echo -e "\e[0;49;32m $2 \e[0m"
    echo "$1"
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

error_exit () {
println 'error' "$1";
exit 1

}