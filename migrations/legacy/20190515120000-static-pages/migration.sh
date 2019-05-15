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

printf "Creating Static Page Template...\n\n"

printf "Adding Static Page layout...\n"
clay import -k demo -y $1 < _components.yml
curl -X PUT $http://$1/_components/two-column-layout/instances/static-page@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'

printf "Adding Static Page page template...\n"
clay import -k demo -y $1 < _pages.yml

newPages="$http://$1/_lists/new-pages"
printf "\nAdding Static Page to new pages list...\n"
node ./new-pages.js $newPages
clay import -k demo -y $1 < new_pages.yml
rm ./new_pages.yml

printf "\nAdding Legal Page...\n"
clay import -k demo -y $1 < page_legal.yml
curl -X PUT $http://$1/_pages/legal@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'

printf "\nAdding Contest Rules Page...\n"
clay import -k demo -y $1 < page_contest_rules.yml
curl -X PUT $http://$1/_pages/contest-rules@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'

printf "\nAdding Subscribe Page...\n"
clay import -k demo -y $1 < page_subscribe.yml
curl -X PUT $http://$1/_pages/newsletter-subscribe@published -H 'Authorization: token accesskey' -H 'Content-Type: application/json'

printf "\n\n\n\n"


# TODO: in page links. Need to:
# TODO:     create id on subheader
# TODO:     prepend subheader id with `ip-`
# TODO:     prevent from becoming spa-links
# TODO: mailto links. Need to prevent opening in separate page.
# TODO: remove certain meta values, or provide a way to set them
# TODO:     may need to keep them due to publishing rules, or determine how to modify for template
# TODO: modify migrations to use existing data and update values instead of hard coded in yml
# TODO:     may need to do this for subscription, too
# TODO: make sure all css is working as expected
# TODO: verify if trending should be removed. If not, determine why it won't populate.
# TODO: determine what's going on in sidebar (tertiary?), Why is it hidden?
# TODO: remove all TODOs
