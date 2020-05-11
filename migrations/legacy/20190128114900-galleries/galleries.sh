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

printf "\nCreating Galleries...\n\n\n"

printf "\n\nCreating gallery component instance...\n\n"
curl -X PUT "$http://$1/_components/gallery/instances/new" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "headline": "",
  "primaryHeadline": "",
  "seoHeadline": "",
  "shortHeadline": "",
  "feedImgUrl": "",
  "teaser": "",
  "authors": [],
  "byline": [
    {
      "prefix": "by",
      "names": [],
      "sources": []
    }
  ],
  "secondaryBylineText": "Photograph By",
  "secondaryAttribution": [],
  "dateUpdated": false,
  "content": [
    {
      "_ref": "'$1'/_components/paragraph/instances/new"
    }
  ],
  "slides": [
    {
      "_ref": "'$1'/_components/gallery-slide/instances/new"
    }
  ],
  "slidesNumbered": false,
  "reverseOrder": false,
  "includeInlineAds": false,
  "inlineAd": {
    "_ref": "'$1'/_components/google-ad-manager/instances/billboardBottom"
  },
  "rightRailStickyAd": {
    "_ref": "'$1'/_components/google-ad-manager/instances/halfPageBottom"
  },
  "tags": {
    "_ref": "'$1'/_components/tags/instances/new"
  },
  "sideShare": {},
  "sectionFront": "",
  "secondaryGalleryType": "",
  "contentType": "gallery",
  "syndicatedUrl": "",
  "syndicationStatus": "original",
  "showSocial": true,
  "eligibleForGoogleStandout": false,
  "sources": [],
  "slugLock": true,
  "manualSlugUnlock": false
}
';

printf "\n\nCreating gallery slide component instance...\n\n"
curl -X PUT "$http://$1/_components/gallery-slide/instances/new" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "slideEmbed": null,
  "title": "",
  "description": "",
  "hashLinkPrefix": ""
}
';

printf "Creating page...\n"
cat ./_pages.yml | clay import -k demo -y $1

printf "\n\nUpdating _lists new-pages...\n\n"
clay export "$1/_lists/new-pages" -y > ./lists.yml;
node ./lists-update.js;
cat ./lists.yml | clay import -k demo -y $1
rm ./lists.yml

printf "\n\nCreating new index...\n\n"
curl -X PUT "$es/published-content_v1" -H 'Content-Type: application/json' -d'
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
curl -X POST "$es/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": {
    "index": "published-articles_v1"
  },
  "dest": {
    "index": "published-content_v1"
  }
}';

printf "\n\nRemoving old alias and adding new...\n\n"
curl -X POST "$es/_aliases" -H 'Content-Type: application/json' -d'
{
    "actions" : [
        { "remove" : { "index" : "published-articles_v1", "alias" : "published-articles" } },
        { "add" : { "index" : "published-content_v1", "alias" : "published-content" } }
    ]
}
'

printf "\n\n\n\n"
