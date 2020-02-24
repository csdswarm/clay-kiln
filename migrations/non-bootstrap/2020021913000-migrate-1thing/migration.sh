#! /bin/bash

scriptdir="$(dirname "$0")"
cd "$scriptdir"

if [ "$1" != "" ]; then
  if [ "$1" == "clay.radio.com" ]; then
    es="$1" && env='local';
  elif [ "$1" == "dev-clay.radio.com" ]; then
    es='http://dev-es.radio-dev.com' && env='dev';
  elif [ "$1" == "stg-clay.radio.com" ]; then
    es='http://es.radio-stg.com' && env='stg';
  elif [ "$1" == "www.radio.com" ]; then
    es='http://es.radio-prd.com' && env='prd';
  fi
  printf "Updating environment $env"
else
  set "clay.radio.com" && env='local' && es="$1";
  printf "No environment specified. Updating environment $env\n"
fi

#
# We need to exclude existing content from the import, so this command
#   1. fetches published content using the tags which indicate they came from
#      imlistening.radio.com
#   2. parses the result into a list of canonical urls (requires jq which can be
#      installed via `brew install jq`)
#   3. outputs that list to a file whose path will be passed to the
#      frequency-clay-translator cli
#
curl "$es:9200/published-content/_search" \
  --silent \
  --show-error \
  -H 'Content-Type: application/json' \
  -H 'Authorization: token accesskey' \
  -d '@existing-content-search.json' \
  | jq '[.hits.hits[] | ._source.canonicalUrl]' > existing-urls.json

prevExitCode=$?

if [ $prevExitCode -ne 0 ]; then
  echo 'exiting migration due to error in previous step'
  exit $prevExitCode
fi

# not sure why canonicalUrls are http instead of https.  It doesn't match the
#   canonical urls in frequency which is the confusing part.  This command is
#   just a platform-consistent way of replacing all instances like you'd expect.
perl -p -i -e 's/"http:/"https:/g' existing-urls.json

prevExitCode=$?
if [ $prevExitCode -ne 0 ]; then
  echo 'exiting migration due to error in previous step'
  rm -f existing-urls.json
  exit $prevExitCode
fi

pathToExistingUrls="$PWD/existing-urls.json"

pushd ../../../../frequency-clay-translator

# we only want blogs because of the nature of where articles originated on
#   imlistening.radio.com.  Blogs indicate they originated from
#   imlistening.radio.com whereas articles originated elsewhere.
if [ "$env" = 'prd' ]; then
  npm run prd-import-content --silent \
    api=1thingPrd \
    importType=full \
    publish=true \
    excludeCanonicalUrls="$pathToExistingUrls"
elif [ "$env" = 'local' ]; then
  npm run import-content --silent \
    api=1thingStg \
    importType=full \
    publish=true \
    excludeCanonicalUrls="$pathToExistingUrls"
else
  npm run "$env-import-content" --silent \
    api=1thingStg \
    importType=full \
    publish=true \
    excludeCanonicalUrls="$pathToExistingUrls"
fi

popd

rm -f existing-urls.json
