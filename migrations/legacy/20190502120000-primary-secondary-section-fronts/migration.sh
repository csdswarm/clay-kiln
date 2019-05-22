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

printf "Add new section front lists...\n"
cat ./_lists.yml | clay import -k demo -y $1

printf "\nUpdating New Pages to Add Section Front...\n\n"

# _lists/new-pages
listType="new-pages"
printf "\n\nUpdating _lists instance $listType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_lists/$listType > ./lists-$listType.json
node ./new-pages-update.js "$1" "$listType";
cat ./lists-$listType.yml | clay import -k demo -y $1
rm ./lists-$listType.json
rm ./lists-$listType.yml
printf "\n\n\n\n"
