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

# create /_components/meta-tags/instances/general
printf "\n\nCreating new meta-tags instance"
curl -X PUT $http://$1/_components/meta-tags/instances/general -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -o /dev/null -s -d '
{
  "authors": [],
  "publishDate": "",
  "contentType": "",
  "sectionFront": "",
  "secondaryArticleType": ""
}'
curl -X PUT $http://$1/_components/meta-tags/instances/general@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -o /dev/null -s

# update /_pages/new-two-col
printf "\n\nTwo Col Layout - $http://$1/_pages/new-two-col\n\n"
page="new-two-col"
printf "\n\nUpdating $page...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_pages/$page > ./$page.json

# if necessary, adds metatags instance to page head and saves new json to $page-done.json
node ./update-page-head.js "$1" "$page";
# file only exists if a reindex needs to occur
if [ -f ./$page-done.json ]
then
  curl -X PUT $http://$1/_pages/$page -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./$page-done.json -o /dev/null -s
  curl -X PUT $http://$1/_pages/$page@published -H 'Authorization: token accesskey' -o /dev/null -s
  rm ./$page-done.json
fi

rm ./$page.json

# update /_pages/new-one-col
# update /_pages/section-front
# update /_pages/homepage
# update /_pages/index
# update /_pages/general
# update /_pages/curated-topic
# update /_pages/topic - dynamic page
# update /_pages/author