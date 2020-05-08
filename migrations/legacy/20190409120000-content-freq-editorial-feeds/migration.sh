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

printf "\n\nCreating Frequency Editorial Feeds List...\n\n\n"
cat ./_lists.yml | clay import -k demo -y $1

printf "\n\n\n\n"

# Updating existing field mappings
# https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html#_updating_existing_field_mappings

# find out which index is currently being used
printf "\nmaking curl GET to $es/published-content/_alias\n";
curl -X GET "$es/published-content/_alias" > ./aliases.json;
currentIndex=$(node alias "$1");
rm ./aliases.json

mappings=$(curl -X GET "$es/$currentIndex/_mappings");

if [[ $mappings != *"featured"* && $mappings != *"editorialFeeds"* ]]; then
  printf "\nmaking curl GET to $es/_cat/indices?pretty&s=index:desc\n";
  indices=$(curl -X GET "$es/_cat/indices?pretty&s=index:desc" 2>/dev/null);
  # sometimes the currentIndex isn't necessarily the largest. and query brings back in alphabetical order, so 2 > 10
  largestIndex=$(node largest-index "$1" "$indices");

  # increment largetIndex by 1 to create newIndex
  num=$(echo $largestIndex | sed 's/[^0-9]*//g');
  newIndex="$(echo $largestIndex | sed 's/[0-9]*//g')$((num+1))";

  # add featured and editorialFeeds properties to mapping
  newProps="\"featured\": {\"type\": \"boolean\"}, \"editorialFeeds\": {\"type\": \"object\", \"dynamic\": \"true\"}";

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
