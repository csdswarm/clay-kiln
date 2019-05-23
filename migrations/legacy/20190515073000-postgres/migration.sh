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

url=$http://$1/_lists/bookmarks
printf "\nChecking for bookmarks list - $url...\n\n"

if curl --output /dev/null --silent --head --fail "$url"; then
    printf "\nBookmarks list already exists - $url...\n\n"
else
    printf "\nCreating for bookmarks list - $url...\n\n"
    curl -X PUT "$url" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
    []
    ';
fi

printf "\nmaking curl GET to $es:9200/_cat/indices?pretty&s=index:desc\n";
indices=$(curl -X GET "$es:9200/_cat/indices?pretty&s=index:desc" 2>/dev/null);
# sometimes the currentIndex isn't necessarily the largest. and query brings back in alphabetical order, so 2 > 10
largestIndex=$(node largest-index "$1" "$indices");

printf "\n$largestIndex\n"

# find out which index is currently being used
printf "\nmaking curl GET to $es:9200/pages/_alias\n";
curl -X GET "$es:9200/pages/_alias" > ./aliases.json;
currentIndex=$(node alias "$1");

# get settings to be able to create new index with the same settings
printf "\nmaking curl GET to $es:9200/$currentIndex/_settings\n";
curl -X GET "$es:9200/$currentIndex/_settings" > ./settings.json;

# get mappings to be able to update mappings,
printf "\nMaking GET to $es:9200/$currentIndex/_mappings\n";
curl -X GET "$es:9200/$currentIndex/_mappings" > ./mappings.json;

# create new index settings / mappings and save in new-index.json
printf "\ncreating new index settings & mappings\n";
node create-new-index "$1" "$currentIndex";

# file only exists if a reindex needs to occur
if [ -f ./new-index.json ]
then
  echo "Reindexing..."
  # increment largetIndex by 1 to create newIndex
  num=$(echo $largestIndex | sed 's/[^0-9]*//g');
  newIndex="$(echo $largestIndex | sed 's/[0-9]*//g')$((num+1))";

  printf "largestIndex: $largestIndex\n";
  printf "currentIndex: $currentIndex\n";
  printf "newIndex: $newIndex\n";

  # create new index and remove all temp files needed to create it
  curl -X PUT "$es:9200/$newIndex" -H 'Content-Type: application/json' -d @./new-index.json;

  # reindex, converting lead from Array[String] to Array[{_ref, data}]
  reindex=$(sed s/currentIndex/$currentIndex/ ./reindex.json | sed s/newIndex/$newIndex/)
  printf "\nreindex: $reindex";

  curl -X POST "$es:9200/_reindex" -H 'Content-Type: application/json' -d "$reindex"

  sleep 1;

  # update alias to make pages point to our new index
  printf "\n\nRemoving old alias and adding new (pages)...\n\n"
  curl -X POST "$es:9200/_aliases" -H 'Content-Type: application/json' -d "
      {
          \"actions\" : [
              { \"remove\" : { \"index\" : \"$currentIndex\", \"alias\" : \"pages\" } },
              { \"add\" : { \"index\" : \"$newIndex\", \"alias\" : \"pages\" } }
          ]
      }";

  rm ./new-index.json;
else
  echo "Skipping reindex, mapping for urlHistory already exists.";
fi

rm ./settings.json;
rm ./aliases.json;
rm ./mappings.json;


