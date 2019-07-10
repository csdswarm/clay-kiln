#! /bin/bash

if [ "$1" != "" ]; then
  if [ "$1" == "clay.radio.com" ]; then
    es="$1" && http="http";
  elif [ "$1" == "dev-clay.radio.com" ]; then
    es="http://dev-es.radio-dev.com" && http="https";
  elif [ "$1" == "stg-clay.radio.com" ]; then
    es="http://es.radio-stg.com" && http="https";
  elif [ "$1" == "www.radio.com" ]; then
    es="http://es.radio-prd.com" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1";
  printf "No environment specified. Updating environment $http://$1\n"
fi

printf "\ninitializing /_lists/ad-tags...\n\n"

# from here
# https://stackoverflow.com/a/2220646
response=$(curl --write-out %{http_code} --silent --output /dev/null "$http://$1/_lists/ad-tags")

# I'm assuming we'll only receive 200 and 404 responses but PUT'ing on
#   everything not 200 will catch a few unexpected cases.
if [ "${response}" != "200" ]; then
  curl -X PUT "$http://$1/_lists/ad-tags" -H 'authorization: token accesskey' -H 'content-type: application/json' -d '[]'
fi
