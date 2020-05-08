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

printf "\ninitializing ad-tags...\n\n"

# create ad-tags/instances/new
curl -X PUT "$http://$1/_components/ad-tags/instances/new" \
  --silent \
  --show-error \
  -H 'authorization: token accesskey' \
  -H 'content-type: application/json' \
  -d '{"items":[]}' >/dev/null


# initialize /_lists/ad-tags for list autocompletion

# from here
# https://stackoverflow.com/a/2220646
response=$(curl --write-out %{http_code} --silent --output /dev/null "$http://$1/_lists/ad-tags")

# I'm assuming we'll only receive 200 and 404 responses but PUT'ing on
#   everything not 200 will catch a few unexpected cases.
if [ "${response}" != "200" ]; then
  curl -X PUT "$http://$1/_lists/ad-tags" \
    --silent \
    --show-error \
    -H 'authorization: token accesskey' \
    -H 'content-type: application/json' \
    -d '[]' >/dev/null
fi
