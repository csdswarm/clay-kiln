#! /bin/bash

if [ "$1" != "" ]; then
  if [ "$1" == "clay.radio.com" ]; then
    es="$1" && http="http";
  elif [ "$1" == "dev-clay.radio.com" ]; then
    es="http://dev-es.radio-dev.com:9200" && http="https";
  elif [ "$1" == "stg-clay.radio.com" ]; then
    es="http://es.radio-stg.com:9200" && http="https";
  elif [ "$1" == "www.radio.com" ]; then
    es="http://es.radio-prd.com:9200" && http="https";
  elif [ "$1" == "preprod-clay.radio.com" ]; then
    es="https://vpc-prdcms-preprod-elasticsearch-5hmjmnw62ednm5mbfifwdnntdm.us-east-1.es.amazonaws.com" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1";
  printf "No environment specified. Updating environment $http://$1\n"
fi

instance="contest"
layout="_layouts/two-column-layout/instances/$instance"
printf "\n\Creating $layout...\n\n"
node ./create-layout.js "$1" "$instance";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./$instance-layout.json -o /dev/null -s
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s
rm ./$instance-layout.json

printf "\n\nCreating Tags 'contests-new' instance and Contest 'new' instance...\n\n\n"
cat ./_components.yml | clay import -k demo -y -p $1

printf "\n\nCreating 'contest' page...\n\n\n"
cat ./_pages.yml | clay import -k demo -y $1

# _lists/new-pages
listType="new-pages"
printf "\nUpdating _lists instance $listType to add 'contest' page...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_lists/$listType > ./lists-$listType.json
node ./new-pages-update.js "$1" "$listType";
cat ./lists-$listType.yml | clay import -k demo -y $1
rm ./lists-$listType.json
rm ./lists-$listType.yml
printf "\n\n\n\n"

# Updating existing field mappings
# https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html#_updating_existing_field_mappings

# find out which index is currently being used
printf "\nmaking curl GET to $es/published-content/_alias\n";
curl -X GET "$es/published-content/_alias" > ./aliases.json;
currentIndex=$(node alias "$1");
rm ./aliases.json

mappings=$(curl -X GET "$es/$currentIndex/_mappings");

if [[ $mappings != *"startDateTime"* && $mappings != *"endDateTime"* ]]; then
  printf "\nmaking curl GET to $es/_cat/indices?pretty&s=index:desc\n";
  indices=$(curl -X GET "$es/_cat/indices?pretty&s=index:desc" 2>/dev/null);
  # sometimes the currentIndex isn't necessarily the largest. and query brings back in alphabetical order, so 2 > 10
  largestIndex=$(node largest-index "$1" "$indices");

  # increment largetIndex by 1 to create newIndex
  num=$(echo $largestIndex | sed 's/[^0-9]*//g');
  newIndex="$(echo $largestIndex | sed 's/[0-9]*//g')$((num+1))";

  # add featured and editorialFeeds properties to mapping
  newProps="\"startDateTime\": {\"type\": \"date\"}, \"endDateTime\": {\"type\": \"date\"}";

  # assuming this is fixed
  alias="published-content";
  newMappings=$(curl -X GET "$es/$currentIndex/_mappings" 2>/dev/null | sed -n "s/\"properties\":{/\"properties\":{$newProps,/p" | sed -n "s/{\"$currentIndex\":{\(.*\)}}/\1/p");

  printf "\n\nCreating new index ($newIndex)...\n\n"
  curl -X GET "$es/$currentIndex/_settings" > ./settings.json;
  node ./settings-update.js "$1";
  settings=$(cat ./settings.txt);
  curl -X PUT "$es/$newIndex" -H 'Content-Type: application/json' -d "{$settings,$newMappings}";
  rm ./settings.json;
  rm ./settings.txt;

  printf "\r\n\r\nCopying old index data ($currentIndex) to new index ($newIndex)...\n\n"
  curl -X POST "$es/_reindex" -H 'Content-Type: application/json' -d "
  {
    \"source\": {
      \"index\": \"$currentIndex\"
    },
    \"dest\": {
      \"index\": \"$newIndex\"
    }
  }";

  sleep 1;

  printf "\n\nRemoving old alias and adding new ($alias)...\n\n"
  curl -X POST "$es/_aliases" -H 'Content-Type: application/json' -d "
  {
      \"actions\" : [
          { \"remove\" : { \"index\" : \"$currentIndex\", \"alias\" : \"$alias\" } },
          { \"add\" : { \"index\" : \"$newIndex\", \"alias\" : \"$alias\" } }
      ]
  }";
fi
