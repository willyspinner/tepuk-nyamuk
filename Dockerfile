# base image: ubuntu 16.04
FROM ubuntu:xenial
COPY . /app/
WORKDIR /app
# NOTE: our tepuk-nyamuk directory now becomes 'app'.
ENV ENABLE_DATADOG 0    # 1 or 0.
ENV ENABLE_VIM 0             # 1 or 0
ENV ENABLE_AUTO_NPM_INSTALL 0 # 1 or 0

RUN chmod +x bin/setup.bash
RUN ["/bin/bash", "bin/setup.bash"]

# nginx
EXPOSE 80
# gms
EXPOSE 4000
# appcs
EXPOSE 3000


