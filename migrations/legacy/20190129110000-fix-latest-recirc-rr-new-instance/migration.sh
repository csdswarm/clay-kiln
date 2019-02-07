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

printf "\n\Updating latest recirc new instance - $http://$1/_components/latest-recirculation/instances/new...\n\n"
curl -X PUT "$http://$1/_components/latest-recirculation/instances/new" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
    "items": [],
    "tag": "",
    "populateBy": "sectionFront",
    "articles": []
}
';
