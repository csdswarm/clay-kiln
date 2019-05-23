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

printf "Delete youtube-player-head layout from layouts."

# _layouts/one-column-layout/instances/general
layoutType="one-column-layout"
instanceType="general"
printf "\n\nUpdating layout $layoutType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_layouts/$layoutType/instances/$instanceType > ./$layoutType-$instanceType.json
node ./layouts-update.js "$1" "$layoutType" "$instanceType";
cat ./$layoutType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$layoutType-$instanceType.json
rm ./$layoutType-$instanceType.yml
printf "\n\n\n\n"

# _layouts/one-column-layout/instances/bare
layoutType="one-column-layout"
instanceType="bare"
printf "\n\nUpdating layout $layoutType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_layouts/$layoutType/instances/$instanceType > ./$layoutType-$instanceType.json
node ./layouts-update.js "$1" "$layoutType" "$instanceType";
cat ./$layoutType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$layoutType-$instanceType.json
rm ./$layoutType-$instanceType.yml
printf "\n\n\n\n"

# _layouts/one-column-layout/instances/article
layoutType="one-column-layout"
instanceType="article"
printf "\n\nUpdating layout $layoutType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_layouts/$layoutType/instances/$instanceType > ./$layoutType-$instanceType.json
node ./layouts-update.js "$1" "$layoutType" "$instanceType";
cat ./$layoutType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$layoutType-$instanceType.json
rm ./$layoutType-$instanceType.yml
printf "\n\n\n\n"

# _layouts/one-column-full-width-layout/instances/bare
layoutType="one-column-full-width-layout"
instanceType="bare"
printf "\n\nUpdating layout $layoutType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_layouts/$layoutType/instances/$instanceType > ./$layoutType-$instanceType.json
node ./layouts-update.js "$1" "$layoutType" "$instanceType";
cat ./$layoutType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$layoutType-$instanceType.json
rm ./$layoutType-$instanceType.yml
printf "\n\n\n\n"

# _layouts/two-column-layout/instances/article
layoutType="two-column-layout"
instanceType="article"
printf "\n\nUpdating layout $layoutType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_layouts/$layoutType/instances/$instanceType > ./$layoutType-$instanceType.json
node ./layouts-update.js "$1" "$layoutType" "$instanceType";
cat ./$layoutType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$layoutType-$instanceType.json
rm ./$layoutType-$instanceType.yml
printf "\n\n\n\n"

# _layouts/two-column-layout/instances/station
layoutType="two-column-layout"
instanceType="station"
printf "\n\nUpdating layout $layoutType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_layouts/$layoutType/instances/$instanceType > ./$layoutType-$instanceType.json
node ./layouts-update.js "$1" "$layoutType" "$instanceType";
cat ./$layoutType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$layoutType-$instanceType.json
rm ./$layoutType-$instanceType.yml
printf "\n\n\n\n"
