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

# cat ./_layouts.yml | clay import -k demo -y $1
instance="national-contest"
layout="_layouts/two-column-layout/instances/$instance"
printf "\n\Creating $layout...\n\n"
node ./create-layout.js "$1" "$instance";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./$instance-layout.json -o /dev/null -s
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s
rm ./$instance-layout.json

instance="station-contest"
layout="_layouts/two-column-layout/instances/$instance"
printf "\n\Creating $layout...\n\n"
node ./create-layout.js "$1" "$instance";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./$instance-layout.json -o /dev/null -s
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s
rm ./$instance-layout.json

printf "\n\nCreating Tags 'contests-new' instance and Contest 'new' instance...\n\n\n"
cat ./_components.yml | clay import -k demo -y -p $1

printf "\n\nCreating 'station-contest' and 'national-contest' pages...\n\n\n"
cat ./_pages.yml | clay import -k demo -y $1

# _lists/new-pages
listType="new-pages"
printf "\nUpdating _lists instance $listType to add 'station-contest' and 'national-contest' pages...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_lists/$listType > ./lists-$listType.json
node ./new-pages-update.js "$1" "$listType";
cat ./lists-$listType.yml | clay import -k demo -y $1
rm ./lists-$listType.json
rm ./lists-$listType.yml
printf "\n\n\n\n"
