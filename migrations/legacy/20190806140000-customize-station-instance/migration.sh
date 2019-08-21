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
if [[ $(curl "$http://$1/_lists/new-pages" 2>&1) == *"station-front-3"* ]];
then
    echo "Station Front instances already exist";
else
    echo "Setting up Station Front instances";
    
    clay export -y "$http://$1/_layouts/one-column-layout/instances/station" > layout.yml;
    clay export -y "$http://$1/_lists/new-pages" > list.yml;
    clay export -y "$http://$1/_pages/station-front-3" > page.yml;

    node ./modifyLayout.js;
    node ./modifyPage.js;
    node ./addStationFrontToList.js;

    cat ./layout.yml | clay import -y -k demo "$http://$1";
    cat ./page.yml | clay import -y -k demo "$http://$1";
    cat ./list.yml | clay import -y -k demo "$http://$1";

    echo "Publishing station-basic-music layout...";
    curl -X PUT $http://$1/_layouts/one-column-layout/instances/station-basic-music@published -H 'Authorization: token accesskey' -o /dev/null -s

    echo "Deleting station layout...";
    curl -X DELETE $http://$1/_layouts/one-column-layout/instances/station -H 'Authorization: token accesskey' -o /dev/null -s

    echo "Deleting station-front-3 page...";
    curl -X DELETE $http://$1/_pages/station-front-3 -H 'Authorization: token accesskey' -o /dev/null -s

    rm -rf layout.yml page.yml list.yml;
fi
