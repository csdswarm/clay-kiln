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
if [[ $(curl "$http://$1/_components/theme/instances" 2>&1) == *"default"* ]];
then
    echo "Theme has already been setup.";
else
    npm i yamljs node-fetch lodash;

    node ./modifyLayouts.js "$http://$1";

    cat ./components.yml | clay import -y -p -k demo "$http://$1";
    cat ./layouts.yml | clay import -y -p -k demo "$http://$1";

    rm -rf ./node_modules package-lock.json layouts.yml
fi
