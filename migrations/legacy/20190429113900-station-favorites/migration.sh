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

printf "\n\nCreating new station-list instance for favorites\n"
curl -X PUT $http://$1/_components/stations-list/instances/favorites -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -o /dev/null -s -d '
{
  "filterBy": "favorites",
  "listTitle": "",
  "truncatedList": false
}'
curl -X PUT $http://$1/_components/stations-list/instances/favorites@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -o /dev/null -s

cat ./_components.yml | clay import -k demo -y -p $1

curl -X GET -H "Accept: application/json" $http://$1/_components/station-detail/instances/default > ./station-detail.json
node ./update-station-detail.js "$1";
curl -X PUT $http://$1/_components/station-detail/instances/default -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./station-detail.json -o /dev/null -s
curl -X PUT $http://$1/_components/station-detail/instances/default@published -H 'Authorization: token accesskey' -o /dev/null -s

rm ./station-detail.json
