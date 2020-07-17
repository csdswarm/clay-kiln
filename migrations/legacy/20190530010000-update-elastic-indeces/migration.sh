#! /bin/bash

if [ "$1" != "" ]; then
  if [ "$1" == "clay.radio.com" ]; then
    es="$1:9200" && http="http";
  elif [ "$1" == "dev-clay.radio.com" ]; then
    es="http://dev-es.radio-dev.com:9200" && http="https";
  elif [ "$1" == "stg-clay.radio.com" ]; then
    es="http://es.radio-stg.com:9200" && http="https";
  elif [ "$1" == "preprod-clay.radio.com" ]; then
    es='https://vpc-prdcms-preprod-elasticsearch-5hmjmnw62ednm5mbfifwdnntdm.us-east-1.es.amazonaws.com:443' && env='preprod';
	elif [ "$1" == "www.radio.com" ]; then
    es="https://vpc-prdcms-elasticsearch-c5ksdsweai7rqr3zp4djn6j3oe.us-east-1.es.amazonaws.com:443" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1:9200";
  printf "No environment specified. Updating environment $http://$1\n"
fi

printf "\nmaking curl GET to $es/_cat/indices?pretty&s=index:desc\n";
indices=$(curl -X GET "$es/_cat/indices?pretty&s=index:desc" 2>/dev/null);

updateIndices=( "layouts" "pages" "sites" "users" )
for indexPrefix in "${updateIndices[@]}"
do
    # sometimes the currentIndex isn't necessarily the largest. and query brings back in alphabetical order, so 2 > 10
    largestIndex=$(node largest-index "$indexPrefix" "$indices");
    printf "\nLargest index for $indexPrefix: $largestIndex\n"

    # find out which index is currently being used
    printf "\nmaking curl GET to $es/$indexPrefix/_alias\n";
    curl -X GET "$es/$indexPrefix/_alias" > ./aliases.json;
    currentIndex=$(node alias "$indexPrefix");
    printf "\nCurrent alias for $indexPrefix: $currentIndex\n"

    # get settings to be able to create new index with the same settings
    printf "\nmaking curl GET to $es/$currentIndex/_settings\n";
    curl -X GET "$es/$currentIndex/_settings" > ./settings.json;

    # get mappings to be able to update mappings,
    printf "\nMaking GET to $es/$currentIndex/_mappings\n";
    curl -X GET "$es/$currentIndex/_mappings" > ./mappings.json;

    # create new index settings / mappings and save in new-index.json
    printf "\nCreating new index settings & mappings\n";
    node create-new-index "$currentIndex" "$indexPrefix";

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
      curl -X PUT "$es/$newIndex" -H 'Content-Type: application/json' -d @./new-index.json;

      # reindex, converting lead from Array[String] to Array[{_ref, data}]
      reindex=$(sed s/currentIndex/$currentIndex/ ./reindex.json | sed s/newIndex/$newIndex/)
      printf "\nreindex: $reindex";

      curl -X POST "$es/_reindex" -H 'Content-Type: application/json' -d "$reindex"

      sleep 1;

      # update alias to make pages point to our new index
      printf "\n\nRemoving old alias and adding new ($indexPrefix)...\n\n"
      curl -X POST "$es/_aliases" -H 'Content-Type: application/json' -d "
          {
              \"actions\" : [
                  { \"remove\" : { \"index\" : \"$currentIndex\", \"alias\" : \"$indexPrefix\" } },
                  { \"add\" : { \"index\" : \"$newIndex\", \"alias\" : \"$indexPrefix\" } }
              ]
          }";

      rm ./new-index.json;
    else
      echo "Skipping reindex, mapping already updated.";
    fi

    rm ./settings.json;
    rm ./aliases.json;
    rm ./mappings.json;
done


