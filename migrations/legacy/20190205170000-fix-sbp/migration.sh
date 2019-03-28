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


curl 'http://clay.radio.com/radium/v1/auth/signin' -H 'Pragma: no-cache' -H 'Origin: http://clay.radio.com' -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: en-US,en;q=0.9' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36' -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*' -H 'Cache-Control: no-cache' -H 'Referer: http://clay.radio.com/account/signup' -H 'Connection: keep-alive' -H 'DNT: 1' --data-binary '{"client_id":"63kk7rrpgfmrdkcndq5f11190r","email":"test4@here.com","password":"test123test","device_id":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36"}' --compressed

curl 'http://clay.radio.com/radium/v1/auth/signin' -H 'origin: https://radium.radio.com' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9'  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36' -H 'content-type: application/json;charset=UTF-8' -H 'accept: application/json, text/plain, */*' -H 'cache-control: no-cache' -H 'authority: radium.radio.com' -H 'referer: https://radium.radio.com/app/webplayer/signup/' -H 'dnt: 1' --data-binary '{"email":"test5@here.com","password":"password1","device_id":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36"}' --compressed
