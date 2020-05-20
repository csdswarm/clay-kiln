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

printf "\nRemoving OOP skins for station-details and directories...\n\n"

stationLayout='_layouts/two-column-layout/instances/station'
generalOneColumnLayout='_layouts/one-column-layout/instances/general'
stationDirectoryOneColumnLayout='_layouts/one-column-layout/instances/station-directory'
stationDirectoryPage='_pages/stations-directory'

curl -X GET -H "Accept: application/json" $http://$1/$stationLayout > ./stationLayout.json
curl -X GET -H "Accept: application/json" $http://$1/$generalOneColumnLayout > ./stationDirectoryOneColumnLayout.json
curl -X GET -H "Accept: application/json" $http://$1/$stationDirectoryPage > ./stationDirectoryPage.json

node ./remove-oop "$1"

curl -X PUT $http://$1/$stationLayout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./stationLayout.json -o /dev/null -s
curl -X PUT $http://$1/$stationLayout@published -H 'Authorization: token accesskey' -o /dev/null -s

curl -X PUT $http://$1/$stationDirectoryOneColumnLayout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./stationDirectoryOneColumnLayout.json -o /dev/null -s
curl -X PUT $http://$1/$stationDirectoryOneColumnLayout@published -H 'Authorization: token accesskey' -o /dev/null -s

curl -X PUT $http://$1/$stationDirectoryPage -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./stationDirectoryPage.json -o /dev/null -s
curl -X PUT $http://$1/$stationDirectoryPage@published -H 'Authorization: token accesskey' -o /dev/null -s

rm ./stationLayout.json
rm ./stationDirectoryOneColumnLayout.json
rm ./stationDirectoryPage.json
