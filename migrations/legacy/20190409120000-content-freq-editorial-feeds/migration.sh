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

printf "\n\nCreating Frequency Editorial Feeds List...\n\n\n"
cat ./_lists.yml | clay import -k demo -y $1

printf "\n\n\n\n"

# Updating existing field mappings
# https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html#_updating_existing_field_mappings

newProps="\"featured\": {\"type\": \"boolean\"}, \"editorialFeeds\": {\"type\": \"object\", \"dynamic\": \"true\"}";

index=$(curl -X GET "$es:9200/_cat/indices?pretty&s=index:desc" 2>/dev/null | sed -n 's/.*\(published-content[^ \n]*\).*/\1/p' | sed q);
mappings=$(curl -X GET "$es:9200/$index/_mappings");

if [[ $mappings != *"featured"* && $mappings != *"editorialFeeds"* ]]; then
  num=$(echo $index | sed 's/[^0-9]*//g');
  newIndex="$(echo $index | sed 's/[0-9]*//g')$((num+1))";
  alias=$(echo $index | sed 's/\(.*\)_.*/\1/g');
  newMappings=$(curl -X GET "$es:9200/$index/_mappings" 2>/dev/null | sed -n "s/\"properties\":{/\"properties\":{$newProps,/p" | sed -n "s/{\"$index\":{\(.*\)}}/\1/p");

  printf "\n\nCreating new index ($newIndex)...\n\n"
  curl -X GET "$es:9200/$index/_settings" > ./settings.json;
  node ./settings-update.js "$1";
  settings=$(cat ./settings.txt);
  curl -X PUT "$es:9200/$newIndex" -H 'Content-Type: application/json' -d "{$settings,$newMappings}";
  rm ./settings.json;
  rm ./settings.txt;

  printf "\r\n\r\nCopying old index data ($index) to new index ($newIndex)...\n\n"
  curl -X POST "$es:9200/_reindex" -H 'Content-Type: application/json' -d "
  {
    \"source\": {
      \"index\": \"$index\"
    },
    \"dest\": {
      \"index\": \"$newIndex\"
    }
  }";

  sleep 1;

  printf "\n\nRemoving old alias and adding new ($alias)...\n\n"
  curl -X POST "$es:9200/_aliases" -H 'Content-Type: application/json' -d "
  {
      \"actions\" : [
          { \"remove\" : { \"index\" : \"$index\", \"alias\" : \"$alias\" } },
          { \"add\" : { \"index\" : \"$newIndex\", \"alias\" : \"$alias\" } }
      ]
  }";
fi
