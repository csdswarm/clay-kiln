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

printf "\n\nCreating Station Detail Page...\n\n\n"

printf "\n\nCreating station detail recently played component instance...\n\n"
curl -X PUT "$http://$1/_components/station-recently-played/instances/default" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "allowed": true
}';

printf "\n\nCreating station detail schedule component instance...\n\n"
curl -X PUT "$http://$1/_components/station-schedule/instances/default" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "allowed": true
}';

printf "\n\nCreating stations list component instance...\n\n"
curl -X PUT "$http://$1/_components/stations-list/instances/recent" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "filterBy": "recent"
}';
printf "\n\nCreating stations list component instance...\n\n"
curl -X PUT "$http://$1/_components/stations-list/instances/market" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "filterBy": "market"
}';
printf "\n\nCreating stations list component instance...\n\n"
curl -X PUT "$http://$1/_components/stations-list/instances/genre" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "filterBy": "genre"
}';
printf "\n\nCreating stations list component instance...\n\n"
curl -X PUT "$http://$1/_components/stations-list/instances/local" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "filterBy": "local"
}';

printf "\n\nCreating station detail discover component instance...\n\n"
curl -X PUT "$http://$1/_components/station-discover/instances/default" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "allowed": true,
  "recentStations": {
    "_ref": "'$1'/_components/stations-list/instances/recent"
  },
  "marketStations": {
    "_ref": "'$1'/_components/stations-list/instances/market"
  },
  "genreStations": {
    "_ref": "'$1'/_components/stations-list/instances/genre"
  }
}';


printf "\n\nCreating station detail component instance...\n\n"
curl -X PUT "$http://$1/_components/station-detail/instances/default" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
  "allowed": true,
  "recentlyPlayedComponent": {
    "_ref": "'$1'/_components/station-recently-played/instances/default"
  },
  "scheduleComponent": {
    "_ref": "'$1'/_components/station-schedule/instances/default"
  },
  "discoverComponent": {
    "_ref": "'$1'/_components/station-discover/instances/default"
  }
}';

printf "\n\nCreating page...\n\n"
cat ./_pages.yml | clay import -k demo -y -p $1

printf "\n\n\n\n"
