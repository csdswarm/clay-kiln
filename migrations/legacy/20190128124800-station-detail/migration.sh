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

printf "\n\nCreating Station Detail Page...\n\n\n"

printf "\n\nCreating station component instance...\n\n"
curl -X PUT "$http://$1/_components/station-detail/instances/new" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "allowed": true
}';

printf "\n\nCreating page...\n\n"
cat ./_pages.yml | clay import -k demo -y -p $1

printf "\n\n\n\n"
