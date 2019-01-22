#! /bin/bash

if [ "$#" -ne 2 ]; then
  echo "Arguments required!
  Environment: <clay|dev-clay|stg-clay|www>
  Key: <clay key for import>

  example: ./small-business-pulse.sh clay demo"
else
    [[ $1 = "clay" ]] && http="http" || http="https"
    echo "Using $http://$1.radio.com"
#    if [[ $(curl "$http://$1.radio.com/_components/section-front/instances" 2>&1) == *"small-business-pulse"* ]];
#    then echo "Small Business Pulse page already exists";
#    else
cat "$(dirname "$0")/small-business-pulse.json" | clay import -k $2 --publish "$1.radio.com";
#   fi
fi
