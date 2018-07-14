# base image: ubuntu 16.04
FROM ubuntu:xenial
RUN mkdir -p ~/projects/tepuk-nyamuk
COPY .  /root/projects/tepuk-nyamuk
WORKDIR /root/projects/tepuk-nyamuk
ENV ENABLE_DATADOG 0
ENV ENABLE_VIM 0
ENV ENABLE_AUTO_NPM_INSTALL 0
# 1 or 0 . 1 for docker containers, 0 for actual usable VMs.
ENV IS_DOCKER_INSTALLATION  1
RUN chmod +x bin/setup.bash
RUN ["/bin/bash", "bin/setup.bash"]
# nginx
EXPOSE 80
# gms
EXPOSE 4000
# appcs
EXPOSE 3000


