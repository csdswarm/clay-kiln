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
if [[ $(curl "$http://$1/_lists/new-pages" 2>&1) == *"station-basic-music"* ]];
then
    echo "Basic Music Station instances already exist";
else
    echo "Setting up Basic Music Stations";

    clay export -y "$http://$1/_layouts/one-column-layout/instances/station" > layout.yml;
    clay export -y "$http://$1/_lists/new-pages" > list.yml;
    clay export -y "$http://$1/_pages/station-front-3" > page.yml;
    clay export -y "$http://$1/_components/station-nav/instances/default" > stationNav.yml;
    clay export -y "$http://$1/_components/station-footer/instances/default" > stationFooter.yml;
    clay export -y "$http://$1/_components/meta-title/instances/station-front-3" > metaTitle.yml;
    clay export -y "$http://$1/_components/meta-url/instances/station-front-3" > metaUrl.yml;
    clay export -y "$http://$1/_components/meta-description/instances/station-front-3" > metaDescription.yml;
    clay export -y "$http://$1/_components/section-front/instances/station-front-3" > sectionFront.yml;
    clay export -y "$http://$1/_components/more-content-feed/instances/station-front-3" > moreContentFeed.yml;

    node ./modifyLayout.js; # Update one-column-layout for header and footer
    node ./setupNewInstances.js # Setup yml for new header and footer instances
    node ./modifyPage.js; # Modify station-front-3 page and rename to station-basic-music
    node ./renameInstances.js # Modify and rename other instances to reference and be named station-basic-music instead of section-front-3
    node ./addStationFrontToList.js; # Update new-pages list to have the new station-basic-music page

    cat ./layout.yml | clay import -y -k demo "$http://$1";
    cat ./page.yml | clay import -y -k demo "$http://$1";
    cat ./list.yml | clay import -y -k demo "$http://$1";

    echo "Creating new station-nav and station-footer instances...";
    cat ./stationNavNew.yml | clay import -y -k demo "$http://$1";
    cat ./stationFooterNew.yml | clay import -y -k demo "$http://$1";

    echo "Copying station-front-3 instances to station-basic-music instances...";
    cat ./renamed_metaTitle.yml | clay import -y -k demo "$http://$1";
    cat ./renamed_metaUrl.yml | clay import -y -k demo "$http://$1";
    cat ./renamed_metaDescription.yml | clay import -y -k demo "$http://$1";
    cat ./renamed_sectionFront.yml | clay import -y -k demo "$http://$1";
    cat ./renamed_moreContentFeed.yml | clay import -y -k demo "$http://$1";

    echo "Deleting station-front-3 instances...";
    curl -X DELETE $http://$1/_layouts/one-column-layout/instances/station -H 'Authorization: token accesskey' -o /dev/null -s
    curl -X DELETE $http://$1/_pages/station-front-3 -H 'Authorization: token accesskey' -o /dev/null -s
    curl -X DELETE $http://$1/_components/meta-title/instances/station-front-3 -H 'Authorization: token accesskey' -o /dev/null -s
    curl -X DELETE $http://$1/_components/meta-url/instances/station-front-3 -H 'Authorization: token accesskey' -o /dev/null -s
    curl -X DELETE $http://$1/_components/meta-description/instances/station-front-3 -H 'Authorization: token accesskey' -o /dev/null -s
    curl -X DELETE $http://$1/_components/more-content-feed/instances/station-front-3 -H 'Authorization: token accesskey' -o /dev/null -s

    echo "Publishing station-basic-music layout...";
    curl -X PUT $http://$1/_layouts/one-column-layout/instances/station-basic-music@published -H 'Authorization: token accesskey' -o /dev/null -s

    rm -f ./*.yml;
fi
