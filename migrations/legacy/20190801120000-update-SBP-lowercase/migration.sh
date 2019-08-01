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

printf "Update SBP instance to use lowercase 'small business pulse' secondarySectionFront\n"

# _components/more-content-feed/instances/small-business-pulse
componentType="more-content-feed"
instanceType="small-business-pulse"
printf "\n\nUpdating layout $layoutType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./sbp-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"
