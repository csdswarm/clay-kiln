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

node add-to-list $http $1
nodeExitCode=$?
if [ $nodeExitCode -ne 0 ]; then
  echo 'exiting migration due to error in previous step'
  exit $nodeExitCode
fi

if [[ $(curl "$http://$1/_components/section-front/instances" 2>&1) == *"1thing"* ]];
then
  echo "the 1Thing section front already exists";
else
  cat ./1thing.json | clay import -k demo --publish "$http://$1";
fi
