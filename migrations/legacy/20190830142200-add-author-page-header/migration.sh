#! /bin/bash

scriptdir="$(dirname "$0")"
cd "$scriptdir"

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

newPageList="_lists/new-pages"

printf "\nUpdating General Content pages list...\n"

curl -X GET -H "Accept: application/json" $http://$1/$newPageList > ./newPageList.json

node updateNewPageList.js

curl -X PUT $http://$1/$newPageList -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./newPageList.json -o /dev/null -s
curl -X PUT $http://$1/$newPageList@published -H 'Authorization: token accesskey' -o /dev/null -s

rm newPageList.json

printf "\n\nCreating Author Page Header...\n\n\n"
cat ./_components.yml | clay import -k demo -y -p $1
cat ./_pages.yml | clay import -k demo -y -p $1

authorPage="_pages/author"

printf "\nUpdating Current Author Page...\n"

curl -X GET -H "Accept: application/json" $http://$1/$authorPage > ./authorPage.json

node updateAuthorPage.js $1/_components/author-page-header/instances/new

curl -X PUT $http://$1/$authorPage -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./authorPage.json -o /dev/null -s
curl -X PUT $http://$1/$authorPage@published -H 'Authorization: token accesskey' -o /dev/null -s

rm authorPage.json
