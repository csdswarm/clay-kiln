#! /usr/bin/env bash

if [[ "$1" != "" ]]; then
  if [[ "$1" == "clay.radio.com" ]]; then
    es="$1" && http="http";
  elif [[ "$1" == "dev-clay.radio.com" ]]; then
    es="http://dev-es.radio-dev.com" && http="https";
  elif [[ "$1" == "stg-clay.radio.com" ]]; then
    es="http://es.radio-stg.com" && http="https";
  elif [[ "$1" == "www.radio.com" ]]; then
    es="http://es.radio-prd.com" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1";
  printf "No environment specified. Updating environment $http://$1\n"
fi

clay import -k demo -y $1 < ./contest-rules-page.yml
clay import -k demo -y -p $1 < ./migration.yml