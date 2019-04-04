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

printf "\n\nRepublishing all published content...\n\n"

printf "\n\nDumping elasticsearch to file...\n\n"
../../../app/node_modules/.bin/ess get $es:9200/published-content --search '{"storedFields": "_id"}' > ./published-content.txt

printf "\n\nConverting elasticsearch to list of URLs...\n\n"
node ./json-parsing.js;

cat published-content-urls.txt

printf "\n\nRepublishing each URL...\n\n"
while read URL
    do curl -X PUT $URL -H 'Authorization: token accesskey' -H 'Content-Type: application/json'
done < published-content-urls.txt

rm ./published-content.txt ./published-content-urls.txt
