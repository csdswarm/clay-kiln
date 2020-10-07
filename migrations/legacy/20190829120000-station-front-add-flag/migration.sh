#! /bin/bash

if [ "$1" != "" ]; then
  if [ "$1" == "clay.radio.com" ]; then
    http="http";
  else
    http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http";
  printf "No environment specified. Updating environment $http://$1\n"
fi

npm init -f;

npm i yamljs;

stationFront="_components/section-front/instances/station-basic-music"

printf "\n\nAdding stationFront flag to station sectionFront instance...\n\n"
clay export -y "$http://$1/$stationFront" > ./stationFront.yml
node ./modifyComponentInstance.js "$1"

cat ./stationFront.yml | clay import -k demo -y $1
rm -rf ./stationFront.yml ./node_modules ./package*.json
printf "\n\n\n\n"
