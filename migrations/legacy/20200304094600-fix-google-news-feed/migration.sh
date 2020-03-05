#! /bin/bash

expectedDir="20191008103300-add-google-news-feed"
scriptdir="$(dirname "$0")"
pwd="$(pwd "$0")"
if [[ "$pwd" != *"$expectedDir" ]]
then
    echo "updating cd"
    cd "$scriptdir"
fi

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

curl -X GET -H "Accept: application/json" $http://$1/_components/feeds/instances/google-news-feed > ./googleNewsFeed.json

printf "\nUpdating google news feed...\n\n"
node migration.js $http://$1

curl -X PUT $http://$1/_components/feeds/instances/google-news-feed -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./googleNewsFeed.json -o /dev/null -s
curl -X PUT $http://$1/_components/feeds/instances/google-news-feed@published -H 'Authorization: token accesskey' -o /dev/null -s

rm googleNewsFeed.json