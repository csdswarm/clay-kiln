#! /bin/bash

if [[ "$1" != "" ]]; then
  if [[ "$1" == "clay.radio.com" ]]; then
    es="$1" && http="http";
  elif [[ "$1" == "dev-clay.radio.com" ]]; then
    es="http://dev-es.radio-dev.com" && http="https";
  elif [[ "$1" == "stg-clay.radio.com" ]]; then
    es="http://es.radio-stg.com" && http="https";
  elif [[ "$1" == "www.radio.com" ]]; then
    es="http://es.radio-prd.com" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1";
  printf "No environment specified. Updating environment $http://$1\n"
fi

newPages="$http://$1/_lists/new-pages"
printf "Creating Static Page Template...\n\n"

printf "Adding Static Page component...\n"
cat ./_components.yml | clay import -k demo -y $1
cat ./_pages.yml | clay import -k demo -y $1

printf "\nAdding Static Page to new pages list...\n"
node ./new-pages.js ${newPages}
cat ./new_pages.yml | clay import -k demo -y $1
rm ./new_pages.yml

printf "\nAdding Legal Page...\n"
# TODO: Add legal page definition
# cat ./page_legal.yml | clay import -k demo -y $1

printf "\nAdding Contest Rules Page...\n"
# TODO: Add contest rules page definition
# cat ./page_contest_rules.yml | clay import -k demo -y $1

printf "\nAdding Subscribe Page...\n"
# TODO: Add subscribe page definition
# cat ./page_subscribe.yml | clay import -k demo -y $1

printf "\n\n\n\n"
