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

echo "Using $http://$1"

index=$(curl -X GET "$es/_cat/indices?pretty&s=index:desc" 2>/dev/null | sed -n 's/.*\(published-content[^ \n]*\).*/\1/p' | sed q);

checkMappings=$(curl -X GET "$es/$index/_mappings" 2>/dev/null | sed -n "s/{\"$index\":{\(.*\)}}/\1/p");

if [[ $checkMappings != *"secondaryArticleType"* ]]; then

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

  num=$(echo $index | sed 's/[^0-9]*//g');
  newIndex="$(echo $index | sed 's/[0-9]*//g')$((num+1))";
  alias=$(echo $index | sed 's/\(.*\)_.*/\1/g');
mappings=$(curl -X GET "$es/$index/_mappings" 2>/dev/null | sed -n "s/\"properties\":{/\"properties\":{$newProp,/p" | sed -n "s/{\"$index\":{\(.*\)}}/\1/p");

  printf "\n\nCreating new index ($newIndex)...\n\n"
curl -X PUT "$es/$newIndex" -H 'Content-Type: application/json' -d "{$settings,$mappings}";

  printf "\r\n\r\nCopying old index data ($index) to new index ($newIndex)...\n\n"
curl -X POST "$es/_reindex" -H 'Content-Type: application/json' -d "
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
  curl -X POST "$es/_aliases" -H 'Content-Type: application/json' -d "
      {
          \"actions\" : [
              { \"remove\" : { \"index\" : \"$index\", \"alias\" : \"$alias\" } },
              { \"add\" : { \"index\" : \"$newIndex\", \"alias\" : \"$alias\" } }
          ]
      }";
else
  printf "secondaryArticleType already exists on the index\n\n";
fi
