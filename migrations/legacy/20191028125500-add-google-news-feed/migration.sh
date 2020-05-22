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
    es="$1:9200" && http="http";
  elif [ "$1" == "dev-clay.radio.com" ]; then
    es="http://dev-es.radio-dev.com:9200" && http="https";
  elif [ "$1" == "stg-clay.radio.com" ]; then
    es="http://es.radio-stg.com:9200" && http="https";
  elif [ "$1" == "preprod-clay.radio.com" ]; then
    es='https://vpc-prdcms-preprod-elasticsearch-5hmjmnw62ednm5mbfifwdnntdm.us-east-1.es.amazonaws.com:443' && env='preprod';
	elif [ "$1" == "www.radio.com" ]; then
    es="https://vpc-prdcms-elasticsearch-c5ksdsweai7rqr3zp4djn6j3oe.us-east-1.es.amazonaws.com:443" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1:9200";
  printf "No environment specified. Updating environment $http://$1\n"
fi

printf "\nCreating google news feed...\n\n"

# we want to keep the old one so we can put it back after the migration.  This
#   will avoid git from complaining about a file change we would rather ignore
cp googleNewsFeed.json googleNewsFeed.old.json

node migration.js

curl -X PUT $http://$1/_components/feeds/instances/google-news-feed -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./googleNewsFeed.json -o /dev/null -s
curl -X PUT $http://$1/_components/feeds/instances/google-news-feed@published -H 'Authorization: token accesskey' -o /dev/null -s

mv googleNewsFeed.old.json googleNewsFeed.json
