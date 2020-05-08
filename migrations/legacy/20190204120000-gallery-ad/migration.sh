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

printf "\n\nCreating google ad manager instance - $http://$1/_components/google-ad-manager/instances/billboardGallery...\n\n"
curl -X PUT "$http://$1/_components/google-ad-manager/instances/billboardGallery" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
    "adSize": "billboard",
    "adPosition": "leader",
    "adLocation": "btf",
    "sticky": false
}
';

printf "\n\Updating gallery component instance...\n\n"
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
    "_ref": "'$1'/_components/google-ad-manager/instances/billboardGallery"
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
