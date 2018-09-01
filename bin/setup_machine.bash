#!/usr/bin/env bash

# NOTE: This setup script assumes  privileges, an ubuntu 16.04 environment.

if [ -e bin/setup_machine.bash ]; then echo ' running setup .bash ...'; else
    echo "Please run setup.bash in the root directory of the app.";
    exit 1
fi

source bin/functions.sh;
if [ $EUID != 0 ];
then
    error_exit 'You need to run this script as root.'
    exit 1
fi
if [ "$(uname -s)" == 'Darwin' ];
then
    error_exit 'You cannot run this in MAC OSX. Need Ubuntu '
exit 1
fi

pushd .
ROOTDIR=$PWD;
# check environment variables

pushd $ROOTDIR;
#  apt-get -y update
 apt-get -y update
 apt-get -y upgrade
 apt-get -y install software-properties-common


# create common folders, copy common scripts..
mkdir ~/.tepuknyamuk
mkdir ~/willysServerBin
[ -d ~/projects ] || mkdir ~/projects;
mkdir ~/applications
cp bin/tools/redis-daemon.conf ~/.tepuknyamuk
cp bin/tools/colors ~/willysServerBin
cp bin/tools/.aliases ~
cp bin/tools/.startup ~



cd ~/.tepuknyamuk
# replace Pid file for redis daemonize.
sed -i -e "s@REPLACE_PIDFILE@$(pwd)/redis-server-daemon.pid@g" ~/.tepuknyamuk/redis-daemon.conf
popd;


# replace directories in tepuk nyamuk script if is docker installation.

# put tepuk nyamuk scripts as path.
scriptsdir="$ROOTDIR/scripts"


# put willysServerBin as path and configure .bashrc.
cd ~/willysServerBin;
echo "export PATH=\"\$PATH:$PWD" >> ~/.bashrc
echo "export PATH=\"\$PATH:$scriptsdir" >> ~/.bashrc
echo "source ~/.aliases;" >> ~/.bashrc;
echo "source ~/.startup;" >> ~/.bashrc;
if [ "$IS_DOCKER_INSTALLATION" == '0' ] ; then
    echo "source ~/.aliases" >> ~/.bashrc
    echo "source ~/.startup" >> ~/.bashrc
fi

# install redis
cd ~/applications;
command -v curl || apt-get -y install  curl;
curl -O http://download.redis.io/redis-stable.tar.gz || { error_exit "couldn't download redis. Check internet connection?" && exit 1; };
tar xzvf redis-stable.tar.gz && rm redis-stable.tar.gz;
cd redis-stable;
command -v gcc || apt-get -y  install gcc;
command -v make || apt-get -y  install make;
( make &&  make install && ln -s src/redis-server ~/willysServerBin/redis-server && ln -s src/redis-cli ~/willysServerBin/redis-cli) || { error_exit "redis installation error." && exit 1; }



# install apt packages (htop,  postgresql, ncdu, nginx, toilet, figlet)
    # get postgres 10 ppa
    add-apt-repository "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -sc)-pgdg main"
    command -v wget ||  apt-get -y  install  wget
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc |  apt-key add -
     apt-get -y update
    # install packages
     apt-get -y install htop ncdu nginx figlet toilet postgresql-10 || { error_exit "couldn't download apt packages." && exit 1;};

# install node js
command -v node || ( curl -sL https://deb.nodesource.com/setup_8.x | bash - &&  apt-get -y install  nodejs)

command -v node || { error_exit "nodejs didn't install properly. exiting.."  && exit 1; }
# install npm packages
 npm install -g forever
 npm install -g yarn


# nginx conf settings
cd "$ROOTDIR";
rm /etc/nginx/sites-enabled/default
cp bin/nginx/tepuk-nyamuk /etc/nginx/sites-enabled

# install datadog.
cd "$ROOTDIR";


# install vim goodies
    mkdir -p ~/.vim/autoload ~/.vim/bundle && curl -LSso ~/.vim/autoload/pathogen.vim https://tpo.pe/pathogen.vim
    echo "$vimrccontents" > ~/.vimrc;
    command -v git >/dev/null 2>&1 || apt-get -y install git
    git clone https://github.com/scrooloose/nerdtree.git ~/.vim/bundle/nerdtree
    git clone https://github.com/scrooloose/syntastic.git ~/.vim/bundle/syntastic
    git clone https://github.com/vim-airline/vim-airline.git ~/.vim/bundle/vim-airline
    git clone https://github.com/vim-airline/vim-airline-themes ~/.vim/bundle/vim-airline-themes
    git clone https://github.com/airblade/vim-gitgutter.git ~/.vim/bundle/vim-gitgutter
    git clone https://github.com/pangloss/vim-javascript.git ~/.vim/bundle/vim-javascript

# TODO: to test:
source ~/.bashrc
println 'info' "Installation is done. It would now be useful to clone your project repositories, and configure, npm install them. "
println 'info' "Also, set up postgresql users, roles, dbs if needed. "
println 'info' "You will need to configure the firewall for nginx. To do that, do : sudo ufw allow 'Nginx HTTP'"

popd;



