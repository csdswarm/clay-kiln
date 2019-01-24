#! /bin/bash

#import the script that to add an index
source "$(dirname $0)/../addIndex.sh"

if [ "$#" -ne 2 ]; then
  echo "Arguments required!
  Environment: <clay|dev-clay|stg-clay|www>
  Key: <clay key for import>

  example: ./small-business-pulse.sh clay demo"
else
    [[ $1 = "clay" ]] && http="http" || http="https"

    if [ "$1" == "clay" ]; then
        es="http://localhost";
    elif [ "$1" == "dev-clay" ]; then
        es="http://dev-es.radio-dev.com";
    elif [ "$1" == "stg-clay" ]; then
        es="http://es.radio-stg.com";
    elif [ "$1" == "www" ]; then
        es="http://es.radio-prd.com";
    fi

    echo "Using $http://$1.radio.com"
    if [[ $(curl "$http://$1.radio.com/_components/section-front/instances" 2>&1) == *"small-business-pulse"* ]];
    then
        echo "Small Business Pulse page already exists";
    else
        cat "$(dirname "$0")/small-business-pulse.json" | clay import -k $2 --publish "$http://$1.radio.com";

        addIndex "$es" "secondaryArticleType" "keyword"
   fi
fi


