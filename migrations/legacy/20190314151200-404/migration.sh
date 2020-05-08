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

printf "\n\nCreating new Stations Carousel instance"
curl -X PUT $http://$1/_components/stations-carousel/instances/404 -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -o /dev/null -s -d '
{
  "overrideTitle": "",
  "filterStationsBy": "market",
  "sectionFront": "",
  "genre": "",
  "sectionFrontManual": "",
  "genreManual": "",
  "title": "stations near you"
}'
curl -X PUT $http://$1/_components/stations-carousel/instances/404@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -o /dev/null -s

printf "\n\nUpdating 404 Page - $http://$1/_pages/404\n\n"
page="_pages/404"
printf "\n\nUpdating $page...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/$page > ./page.json
node ./page-update.js "$1" "/$page";
curl -X PUT $http://$1/$page -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./page.json -o /dev/null -s
curl -X PUT $http://$1/$page@published -H 'Authorization: token accesskey' -o /dev/null -s

# update css to change margin under homepage button from 150px to 50px
curl -X PUT $http://$1/_components/html-embed/instances/static-404 -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./static-404.json -o /dev/null -s
curl -X PUT $http://$1/_components/html-embed/instances/static-404@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./static-404.json -o /dev/null -s

# delete temp file
rm ./page.json
