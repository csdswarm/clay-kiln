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

printf "\n\nUpdating article new instance...\n\n\n"

printf "Get existing instance and adding keys...\n\n\n"

# export the existing, but that also gives sub instances
clay export -k demo -y $1/_components/article/instances/new > components.yml

# find out where the version is for the article
articleEnd=$(cat components.yml | grep -m1 -n '_version:' | cut -d: -f1)

# cut out the rest
head -n $articleEnd components.yml > _components.yml

#append the new fields
echo "        stationTitle: '\${stationTitle}'
        stationLogoUrl: '\${stationLogoUrl}'
        stationURL: '\${stationURL}'
" >> ./_components.yml


printf "Importing component...\n\n\n"
cat ./_components.yml | clay import -k demo -y $1

# clean up
rm ./*components.yml

printf "\n\n\n\n"
