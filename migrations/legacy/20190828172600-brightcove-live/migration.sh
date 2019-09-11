#! /bin/bash

if [ "$1" != "" ]; then
  if [ "$1" == "clay.radio.com" ]; then
    http="http";
  elif [ "$1" == "dev-clay.radio.com" ]; then
    http="https";
  elif [ "$1" == "stg-clay.radio.com" ]; then
    http="https";
  elif [ "$1" == "www.radio.com" ]; then
    http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http";
  printf "No environment specified. Updating environment $http://$1\n"
fi

printf "\n\nCreating Brightcove Live Component...\n\n\n"
clay import -k demo -y -p "$1" < ./_components.yml

printf "\n\n\n\n"
