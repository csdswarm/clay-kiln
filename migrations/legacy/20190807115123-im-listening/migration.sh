#! /bin/bash

if [ "$1" != "" ]; then
  if [ "$1" == "clay.radio.com" ]; then
    es="$1:9200" && http="http";
  elif [ "$1" == "dev-clay.radio.com" ]; then
    es="http://dev-es.radio-dev.com:9200" && http="https";
  elif [ "$1" == "stg-clay.radio.com" ]; then
    es="http://es.radio-stg.com:9200" && http="https";
  elif [ "$1" == "www.radio.com" ]; then
    es="https://vpc-prdcms-elasticsearch-c5ksdsweai7rqr3zp4djn6j3oe.us-east-1.es.amazonaws.com:443" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1:9200";
  printf "No environment specified. Updating environment $http://$1\n"
fi

echo "Using $http://$1"

node add-to-list $http $1
nodeExitCode=$?
if [ $nodeExitCode -ne 0 ]; then
  echo 'exiting migration due to error in previous step'
  exit $nodeExitCode
fi

if [[ $(curl "$http://$1/_components/section-front/instances" 2>&1) == *"im-listening"* ]];
then
  echo "the I'm Listening section front already exists";
else
  cat ./im-listening.json | clay import -k demo --publish "$http://$1";
fi
