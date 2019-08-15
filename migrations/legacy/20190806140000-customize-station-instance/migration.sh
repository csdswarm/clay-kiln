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
if [[ $(curl "$http://$1/_layouts/one-column-layout/instances/station" 2>&1) == *"bottomAdSlot"* ]];
then
    echo "Bottom ad slot in station section front already exists";
else
    npm i yamljs node-fetch;
    clay export -y "$http://$1/_layouts/one-column-layout/instances/station" > layout.yml;
    clay export -y "$http://$1/_lists/new-pages" > list.yml;
    node ./modifyLayout.js;
    node ./addStationFrontToList.js;

    #cat ./layout.yml | clay import -y -k demo "$http://$1";
    cat ./list.yml | clay import -y -k demo "$http://$1";

    #rm -rf ./node_modules package-lock.json #layout.yml list.yml;
fi
