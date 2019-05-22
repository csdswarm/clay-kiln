#! /bin/bash

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

node ./template.js $http://$1
printf "Importing updates to clay"
clay import -k demo -y $1 < ./_update.yml
rm ./_update.yml

printf "\nPublishing static-page layout\n\n"
curl -X PUT $http://$1/_components/two-column-layout/instances/static-page@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
printf "\n\nPublishing new legal page\n\n"
curl -X PUT $http://$1/_pages/legal@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
printf "\n\nPublishing new contest rules page\n\n"
curl -X PUT $http://$1/_pages/contest-rules@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
printf "\n\nPublishing updated subscribe page\n\n"
curl -X PUT $http://$1/_pages/newsletter-subscribe@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
printf "\n\nDone creating static pages\n\n\n\n"
