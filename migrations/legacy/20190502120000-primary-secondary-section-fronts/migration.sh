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

printf "Add new podcast module instances...\n"
cat ./_lists.yml | clay import -k demo -y $1

printf "\n\n\n\n"

# Updating existing field mappings
# https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html#_updating_existing_field_mappings
# Renaming mapping key
# https://www.elastic.co/guide/en/elasticsearch/reference/7.0/rename-processor.html

# find out which index is currently being used 
printf "\nmaking curl GET to $es:9200/published-content/_alias\n";
curl -X GET "$es:9200/published-content/_alias" > ./aliases.json;
currentIndex=$(node alias "$1");
rm ./aliases.json

mappings=$(curl -X GET "$es:9200/$currentIndex/_mappings");

if [[ $mappings == *"secondaryArticleType"* ]]; then
  printf "\nmaking curl GET to $es:9200/_cat/indices?pretty&s=index:desc\n";
  indices=$(curl -X GET "$es:9200/_cat/indices?pretty&s=index:desc" 2>/dev/null);
  # sometimes the currentIndex isn't necessarily the largest. and query brings back in alphabetical order, so 2 > 10
  largestIndex=$(node largest-index "$1" "$indices");

  # increment largetIndex by 1 to create newIndex
  num=$(echo $largestIndex | sed 's/[^0-9]*//g');
  newIndex="$(echo $largestIndex | sed 's/[0-9]*//g')$((num+1))";

  # assuming this is fixed
  alias="published-content";

  printf "\n\nCreating new index ($newIndex)...\n\n"
  curl -X GET "$es:9200/$currentIndex/_settings" > ./settings.json;
  node ./settings-update.js "$1";
  settings=$(cat ./settings.txt);
  curl -X PUT "$es:9200/$newIndex" -H 'Content-Type: application/json' -d "{$settings,$mappings}";
  rm ./settings.json;
  rm ./settings.txt;

  # new prop name secondarySectionFront to replace secondaryArticleType
  currentKey="secondaryArticleType";
  newKey="secondarySectionFront";
  pipeline = "rename_${currentKey}_to_${newKey}_pipeline";

  printf "\r\n\r\nRenaming old mapping key ($currentKey) to new mapping key ($newKey)...\n\n"
  curl -X PUT "$es:9200/_ingest/pipeline/$pipeline" -H 'Content-Type: application/json' -d "
  {
    \"description\" : \"rename secondaryArticleType to secondarySectionFront\",
    \"processors\" : [
      {
        \"rename\": {
          \"field\": \"$currentKey\",
          \"target_field\": \"$newKey\"
        }
      }
    ]
  }";

  printf "\r\n\r\nCopying old index data ($currentIndex) to new index ($newIndex)...\n\n"
  curl -X POST "$es:9200/_reindex" -H 'Content-Type: application/json' -d "
  {
    \"source\": {
      \"index\": \"$currentIndex\"
    },
    \"dest\": {
      \"index\": \"$newIndex\"
      \"pipeline\": \"$pipeline\"
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
  }";
fi
