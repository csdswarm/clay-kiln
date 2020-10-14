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
    es="http://es.radio-prd.com" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1:9200";
  printf "No environment specified. Updating environment $http://$1\n"
fi

echo "Using $http://$1"
if [[ $(curl "$http://$1/_components/theme/instances" 2>&1) == *"default"* ]];
then
    echo "Theme has already been setup.";
else
    npm init -f;
    npm i yamljs node-fetch lodash;

    node ./modifyLayouts.js "$http://$1";

    cat ./components.yml | clay import -y -p -k demo "$http://$1";
    cat ./layouts.yml | clay import -y -p -k demo "$http://$1";

    rm -rf ./node_modules package*.json layouts.yml
fi
