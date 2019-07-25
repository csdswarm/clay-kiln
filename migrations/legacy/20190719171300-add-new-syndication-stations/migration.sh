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

printf "\nUpdating Editorial Feed List...\n\n"

editorialFeedList='_lists/freq_editorial_feeds'

curl -X GET -H "Accept: application/json" $http://$1/$editorialFeedList > ./editorialFeedList.json

node ./updateEditorialFeedList "$1"

curl -X PUT $http://$1/$editorialFeedList -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./editorialFeedList.json -o /dev/null -s
curl -X PUT $http://$1/$editorialFeedList@published -H 'Authorization: token accesskey' -o /dev/null -s

rm ./editorialFeedList.json

printf "\nAdding Corporate Website options to syndicated section...\n\n"

corporateWebsiteList='_lists/corporate_websites'

curl -X PUT $http://$1/$corporateWebsiteList -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./corporateWebsiteList.json -o /dev/null -s
curl -X PUT $http://$1/$corporateWebsiteList@published -H 'Authorization: token accesskey' -o /dev/null -s

node ./updateElasticsearchMapping "$1" "${es}:9200" "${http}"
