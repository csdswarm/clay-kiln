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

# printf "Add new section front lists...\n"
# cat ./_lists.yml | clay import -k demo -y $1

printf "\n\nResetting data for new instance of podcast list"
curl -X PUT $http://$1/_components/podcast-list/instances/new -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -o /dev/null -s -d '{ "items": [] }'

printf "\nUpdating Section Fronts to Add Podcast Modules...\n\n"

# _components/section-front/instances/new
componentType="section-front"
instanceType="new"
printf "\n\nUpdating component $componentType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./section-front-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"

# _components/section-front/instances/sports
componentType="section-front"
instanceType="sports"
printf "\n\nUpdating component $componentType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./section-front-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"

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
