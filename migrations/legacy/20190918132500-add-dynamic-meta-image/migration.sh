#! /bin/bash

scriptdir="$(dirname "$0")"
cd "$scriptdir"

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

printf "\nCreating dynamic-meta-image instance for stations...\n\n"
cat ./_components.yml | clay import -k demo -y -p $1

printf "\nUpdating stations page...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_pages/station > ./station.json

node migration.js $1

curl -X PUT $http://$1/_pages/station -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./station.json -o /dev/null -s
curl -X PUT $http://$1/_pages/station@published -H 'Authorization: token accesskey' -o /dev/null -s

rm station.json
