#!/usr/bin/env bash

# NOTE: This setup script assumes sudo privileges, an ubuntu 16.04 environment and gcc.

source functions.sh;

if [ $EUID -ne 0 ];
then
error_exit 'You need to run this script as root.'
exit 1
fi

if [ "$(uname -s)" == 'Darwin' ];
then
error_exit 'You cannot run this in MAC OSX. Need Ubuntu 16.04'
fi

if [ -e setup.sh ]; then echo ' running setup .sh ...'; else
    error_exit "Please run setup.sh in the same directory.";
fi

pushd .
#  apt-get update
sudo apt-get update
yes |sudo apt-get upgrade

# install vim goodies
mkdir -p ~/.vim/autoload ~/.vim/bundle && curl -LSso ~/.vim/autoload/pathogen.vim https://tpo.pe/pathogen.vim

echo "$vimrccontents" > ~/.vimrc;
git clone https://github.com/scrooloose/nerdtree.git ~/.vim/bundle/nerdtree
git clone https://github.com/scrooloose/syntastic.git ~/.vim/bundle/syntastic
git clone https://github.com/vim-airline/vim-airline ~/.vim/bundle/vim-airline
git clone https://github.com/vim-airline/vim-airline-themes ~/.vim/bundle/vim-airline-themes
git clone git://github.com/airblade/vim-gitgutter.git ~/.vim/bundle/vim-gitgutter
git clone https://github.com/pangloss/vim-javascript.git ~/.vim/bundle/vim-javascript


# create common folders, copy common scripts..
mkdir ~/.tepuknyamuk
mkdir ~/willysServerBin
mkdir ~/projects
mkdir ~/applications

cp tools/redis-daemon.conf ~/.tepuknyamuk
cp tools/colors ~/willysServerBin
cp tools/.aliases ~
cp tools/.startup ~
#//cp ../scripts/* ~/willysServerBin/
scriptsdir="$(pwd)"


# put willysServerBin as path.
cd ~/willysServerBin;

echo "export PATH=\"\$PATH:$PWD" >> ~/.bashrc
echo "export PATH=\"\$PATH:$scriptsdir" >> ~/.bashrc
echo "source ~/.aliases" >> ~/.bashrc
echo "source ~/.startup" >> ~/.bashrc

# install redis
cd ~/applications

curl -O http://download.redis.io/redis-stable.tar.gz || error_exit "couldn't download redis. Check internet connection?"
tar xzvf redis-stable.tar.gz && rm redis-stable.tar.gz
cd redis-stable
make && sudo make install && ln -s src/redis-server ~/willysServerBin/redis-server && ln -s src/redis-cli ~/willysServerBin/redis-cli



# install apt packages (htop, postgres, ncdu, nginx, toilet, figlet)
yes | sudo apt-get install htop postgresql postgresql-contrib ncdu nginx figlet toilet || error_exit "couldn't download apt packages.";
sudo systemctl start

# install node js
command -v node || ( curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash - && yes| sudo apt-get install -y nodejs)


# install npm packages
sudo npm install -g forever
sudo npm install -g httpster
#sudo npm install -g tldr # TLDR doesn't work lmao
sudo npm install -g yarn


# install datadog. TODO.

# done

popd
source ~/.aliases
source ~/.startup
println 'info' "Installation is done. It would now be useful to clone your project repositories, and configure them. "
println 'info' "Also, set up postgresql users, roles, dbs if needed. "


