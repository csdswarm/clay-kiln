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

echo "Using $http://$1"
if [[ $(curl "$http://$1/_components/section-front/instances" 2>&1) == *"small-business-pulse"* ]];
then
    echo "Small Business Pulse page already exists";
else
    cat ./small-business-pulse.json | clay import -k demo --publish "$http://$1";

    newProp="\"secondaryArticleType\": {\"type\": \"keyword\"}";
        settings='
            "settings" : {
              "analysis": {
                "analyzer": {
                  "tag_analyzer": {
                    "tokenizer": "standard",
                    "filter": [
                      "standard",
                      "my_ascii_folding",
                      "lowercase"
                    ],
                    "char_filter": [
                      "remove_whitespace",
                      "remove_punctuation"
                    ]
                  },
                  "author_analyzer": {
                    "tokenizer": "standard",
                    "filter": [
                      "standard",
                      "my_ascii_folding",
                      "lowercase"
                    ],
                    "char_filter": [
                      "remove_whitespace",
                      "remove_punctuation"
                    ]
                  }
                },
                "filter": {
                  "my_ascii_folding": {
                    "type": "asciifolding",
                    "preserve_original": true
                  }
                },
                "char_filter": {
                  "remove_whitespace": {
                    "type": "pattern_replace",
                    "pattern": "\\s+",
                    "replacement": "-"
                  },
                  "remove_punctuation": {
                    "type": "pattern_replace",
                    "pattern": "[.,/#!$%\\^&\\*;:{}=\\-_`~()'\'']",
                    "replacement": ""
                  }
                }
              }
            }';

    index=$(curl -X GET "$es:9200/_cat/indices" 2>/dev/null | sed -n 's/.*\(published[^ ]*\).*/\1/p');
    num=$(echo $index | sed 's/[^0-9]*//g');
    newIndex="$(echo $index | sed 's/[0-9]*//g')$((num+1))";
    alias=$(echo $index | sed 's/\(.*\)_.*/\1/g');
    mappings=$(curl -X GET "$es:9200/$index/_mappings" 2>/dev/null | sed -n "s/\"properties\":{/\"properties\":{$newProp,/p" | sed -n "s/{\"$index\":{\(.*\)}}/\1/p");

    printf "\n\nCreating new index ($newIndex)...\n\n"
    curl -X PUT "$es:9200/$newIndex" -H 'Content-Type: application/json' -d "{$settings,$mappings}";

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

    printf "\n\nDeleting old index\n\n";
    curl -X DELETE "$es:9200/$index";
fi
