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

printf "\n\nCreating feed instance - $http://$1/_components/feeds/instances/reversechron...\n\n"
curl -X PUT "$http://$1/_components/feeds/instances/reversechron" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
    "index": "published-content",
    "query": {
        "query": {
            "match_all": {}
        },
        "size": 20,
        "sort": {
            "date": "desc"
        }
    },
    "meta": {
        "renderer": "rss",
        "contentType": "application/rss+xml",
        "fileExtension": "rss",
        "link": "http://clay.radio.com",
        "title": "Radio.com Reverse Chron Feed",
        "description": "Most recent content from Radio.com"
    },
    "transform": "article",
    "results": []
}
';

newProp="\"content\": {\"type\": \"nested\", \"dynamic\": \"true\"}";

index=$(curl -X GET "$es:9200/_cat/indices?pretty&s=index:desc" 2>/dev/null | sed -n 's/.*\(published-content[^ \n]*\).*/\1/p' | sed q);
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
