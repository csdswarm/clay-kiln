#! /bin/bash

if [ "$1" != "" ]; then
  if [ "$1" == "clay.radio.com" ]; then
    es="$1" && http="http";
  elif [ "$1" == "dev-clay.radio.com" ]; then
    es="http://dev-es.radio-dev.com" && http="https";
  elif [ "$1" == "stg-clay.radio.com" ]; then
    es="http://es.radio-stg.com" && http="https";
  elif [ "$1" == "radio.com" ]; then
    es="http://es.radio-prd.com" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1";
  printf "No environment specified. Updating environment $http://$1\n"
fi

printf "\nCreating Station Detail Page...\n\n\n"

printf "Publishing new layout...\n"
curl -X PUT "$http://$1/_components/two-column-layout/instances/station@published" -H 'Authorization: token accesskey' -H 'Content-Type: application/json'

printf "Creating page...\n"
cd ./migrations/legacy/station-detail && cat ./_pages.yml | clay import -k demo -y $1

printf "\n\nCreating station component instance...\n\n"
curl -X PUT "$http://$1/_components/station-detail/instances/new" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "allowed": true
}';

printf "\n\n\n\n"
