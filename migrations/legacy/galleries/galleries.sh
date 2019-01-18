#! /bin/bash

printf "\nCreating Galleries...\n\n\n"

printf "Creating page...\n"
cd ./migrations/legacy/galleries && cat ./_pages.yml | clay import -k demo -y radio.com

printf "\n\nCreating component instance...\n\n"
curl -X PUT https://radio.com/_components/gallery/instances/new -H 'Authorization: token accesskey' -H 'Content-Type: application/json'

printf "\n\nUpdating _lists new-pages...\n\n"
clay export radio.com/_lists/new-pages -y > ./lists.yml;
node ./lists-update.js;
cat ./lists.yml | clay import -k demo -y radio.com

printf "\n\nCreating new index...\n\n"
curl -X PUT "https://radio.com:9200/published-content_v1" -H 'Content-Type: application/json' -d'
{
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
  },
  "mappings" : {
    "_doc": {
      "dynamic": false,
      "properties": {
        "displayHeadline": {
          "type": "text"
        },
        "plaintextDisplayHeadline": {
          "type": "text"
        },
        "authors": {
          "type": "keyword",
          "fields": {
            "normalized": {
              "type": "text",
              "analyzer": "author_analyzer"
            }
          }
        },
        "date": {
          "type": "date",
          "store": true
        },
        "canonicalUrl": {
          "type": "keyword",
          "store": true
        },
        "feedImage": {
          "type": "keyword"
        },
        "tags": {
          "type": "keyword",
          "fields": {
            "normalized": {
              "type": "text",
              "analyzer": "tag_analyzer"
            }
          }
        },
        "sectionFront": {
          "type": "keyword"
        },
        "contentType": {
          "type": "keyword"
        },
        "teaser": {
          "type": "text"
        },
        "site": {
          "type": "keyword"
        },
        "pageUri": {
          "type": "keyword",
          "store": true
        },
        "lead": {
          "type": "keyword"
        }
      }
    }
  }
}
';

printf "\r\n\r\nCopying old index data to new index...\n\n"
curl -X POST "https://radio.com:9200/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": {
    "index": "published-articles_v1"
  },
  "dest": {
    "index": "published-content_v1"
  }
}';

printf "\n\nRemoving old alias and adding new...\n\n"
curl -X POST "https://radio.com:9200/_aliases" -H 'Content-Type: application/json' -d'
{
    "actions" : [
        { "remove" : { "index" : "published-articles_v1", "alias" : "published-articles" } },
        { "add" : { "index" : "published-content_v1", "alias" : "published-content" } }
    ]
}
'

printf "\n\nDeleting old index\n\n"
curl -X DELETE "https://radio.com:9200/published-articles_v1"

printf "\n\n\n\n"
