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

printf "\nUpdating station meta-title...\n\n"

stationMetaTitle="_components/dynamic-meta-title/instances/station"
stationMetaDescription="_components/dynamic-meta-description/instances/station"

curl -X GET -H "Accept: application/json" $http://$1/$stationMetaTitle > ./stationMetaTitle.json
curl -X GET -H "Accept: application/json" $http://$1/$stationMetaDescription > ./stationMetaDescription.json

node ./title-description-update.js "$1"

curl -X PUT $http://$1/$stationMetaTitle -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./stationMetaTitle.json -o /dev/null -s
curl -X PUT $http://$1/$stationMetaTitle@published -H 'Authorization: token accesskey' -o /dev/null -s

curl -X PUT $http://$1/$stationMetaDescription -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./stationMetaDescription.json -o /dev/null -s
curl -X PUT $http://$1/$stationMetaDescription@published -H 'Authorization: token accesskey' -o /dev/null -s

# Delete temp files
rm ./stationMetaTitle.json
rm ./stationMetaDescription.json
