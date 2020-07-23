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
  elif [ "$1" == "preprod-clay.radio.com" ]; then
    es='https://vpc-prdcms-preprod-elasticsearch-5hmjmnw62ednm5mbfifwdnntdm.us-east-1.es.amazonaws.com:443' && env='preprod' && http='https';
	elif [ "$1" == "www.radio.com" ]; then
    es="https://vpc-prdcms-elasticsearch-c5ksdsweai7rqr3zp4djn6j3oe.us-east-1.es.amazonaws.com:443" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1:9200";
  printf "No environment specified. Updating environment $http://$1\n"
fi

newPageList="_lists/new-pages"

printf "\nUpdating General Content pages list...\n"

curl -X GET -H "Accept: application/json" $http://$1/$newPageList > ./newPageList.json

node updateNewPageList.js

curl -X PUT $http://$1/$newPageList -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./newPageList.json -o /dev/null -s
curl -X PUT $http://$1/$newPageList@published -H 'Authorization: token accesskey' -o /dev/null -s

rm newPageList.json

printf "\n\nCreating Host Page Header...\n\n\n"
cat ./_components.yml | clay import -k demo -y -p $1
cat ./_pages.yml | clay import -k demo -y -p $1

hostPage="_pages/host"

printf "\nUpdating Current Host Page...\n"

curl -X GET -H "Accept: application/json" $http://$1/$hostPage > ./hostPage.json

node updateHostPage.js $1/_components/host-page-header/instances/new

curl -X PUT $http://$1/$hostPage -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./hostPage.json -o /dev/null -s
curl -X PUT $http://$1/$hostPage@published -H 'Authorization: token accesskey' -o /dev/null -s

rm hostPage.json
