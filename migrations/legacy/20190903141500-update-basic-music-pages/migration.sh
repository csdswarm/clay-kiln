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

echo "Using $http://$1"
if [[ $(curl "$http://$1/_pages/station-basic-music" 2>&1) == *"topic-page-header"* ]];
then
    echo "Updating Basic Music Stations";

    clay export -y "$http://$1/_pages/station-basic-music" > layout.yml;

    npm install yamljs;

    node ./modifyBasicMusic.js;

    cat ./layout.yml | clay import -y -k demo "$http://$1";

    rm -rf ./node_modules ./*.yml ./*.json;
else
    echo "Nothing to do";
fi
