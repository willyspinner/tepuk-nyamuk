#!/usr/bin/env bash

command -v docker >/dev/null 2>&1|| (echo "Please install docker to continue." && exit 1)

say_or_echo () {
(command -v say >/dev/null 2>&1 && say -v daniel "$1") || echo "$1"
}

(docker build -t tepuk-nyamuk:latest . && say_or_echo "Docker build complete." ) || say_or_echo "Docker build failed."

