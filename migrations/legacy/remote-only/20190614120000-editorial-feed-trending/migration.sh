#! /bin/bash

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

printf "\nUpdating Editorial Terms to Add 'Trending'...\n\n"

# _lists/freq_editorial_feeds
listInstance="freq_editorial_feeds"
printf "\n\nUpdating _lists instance $listInstance...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_lists/$listInstance > ./_lists-$listInstance.json
node ./editorial-terms-update.js "$1" "$listInstance";
cat ./_lists-$listInstance.yml | clay import -k demo -y $1
rm ./_lists-$listInstance.json
rm ./_lists-$listInstance.yml
printf "\n\n\n\n"
