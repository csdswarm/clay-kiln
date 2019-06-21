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

printf "\nStation Syndication Migration\n"

# Updating existing field mappings
# https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html#_updating_existing_field_mappings

# find out which index is currently being used
printf "\nmaking curl GET to $es:9200/published-content/_alias\n";
aliases=$(curl -X GET "$es:9200/published-content/_alias" 2>/dev/null);
IFS=', ' read -r -a array <<< $(node alias "$aliases")
currentIndex="${array[0]}";
alias="${array[1]}";

mappings=$(curl -X GET "$es:9200/$currentIndex/_mappings") 2>/dev/null;

if [[ $mappings != *"stationSyndication"* || $mappings != *"genreSyndication"* || $mappings == *"categorySyndication"* ]]; then
  printf "\nmaking curl GET to $es:9200/_cat/indices?pretty&s=index:desc\n";
  indices=$(curl -X GET "$es:9200/_cat/indices?pretty&s=index:desc" 2>/dev/null);
  # sometimes the currentIndex isn't necessarily the largest. and query brings back in alphabetical order, so 2 > 10
  newIndex=$(node largest-index "$indices");
  setting=$(curl -X GET "$es:9200/$currentIndex/_settings") 2>/dev/null;

  # remove category syndication property or add genre and station syndication properties to mapping
  if [[ $mappings == *"categorySyndication"* ]]; then
    indexPayload=$(node remove-category-syndication "$mappings" "$setting");
  else
    indexPayload=$(node index-payload "$mappings" "$setting");
  fi

  printf "\n\nCreating new index ($newIndex)...\n\n"
  curl -X PUT "$es:9200/$newIndex" -H 'Content-Type: application/json' -d "$indexPayload";

  printf "\r\n\r\nCopying old index data ($currentIndex) to new index ($newIndex)...\n\n"
  curl -X POST "$es:9200/_reindex" -H 'Content-Type: application/json' -d "
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
  curl -X POST "$es:9200/_aliases" -H 'Content-Type: application/json' -d "
  {
      \"actions\" : [
          { \"remove\" : { \"index\" : \"$currentIndex\", \"alias\" : \"$alias\" } },
          { \"add\" : { \"index\" : \"$newIndex\", \"alias\" : \"$alias\" } }
      ]
  }"
fi
