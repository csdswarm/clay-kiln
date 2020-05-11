#! /bin/bash

if [[ "$1" != "" ]]; then
  if [[ "$1" == "clay.radio.com" ]]; then
    es="$1:9200" && http="http";
  elif [[ "$1" == "dev-clay.radio.com" ]]; then
    es="http://dev-es.radio-dev.com:9200" && http="https";
  elif [[ "$1" == "stg-clay.radio.com" ]]; then
    es="http://es.radio-stg.com:9200" && http="https";
  elif [[ "$1" == "www.radio.com" ]]; then
    es="https://vpc-prdcms-elasticsearch-c5ksdsweai7rqr3zp4djn6j3oe.us-east-1.es.amazonaws.com:443" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1:9200";
  printf "No environment specified. Updating environment $http://$1\n"
fi

node ./template.js $http://$1
printf "Importing updates to clay"

clay import -k demo -y $1 < ./_template.yml
rm ./_template.yml

clay import -k demo -y -p $1 < ./_layouts.yml
rm ./_layouts.yml

clay import -k demo -y $1 < ./_lists.yml
rm ./_lists.yml

clay import -k demo -y -p $1 < ./_components.yml
rm ./_components.yml

clay import -k demo -y -p $1 < ./_pages.yml
rm ./_pages.yml
