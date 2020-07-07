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
    es="https://vpc-prdcms-elasticsearch-c5ksdsweai7rqr3zp4djn6j3oe.us-east-1.es.amazonaws.com:443" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1:9200";
  printf "No environment specified. Updating environment $http://$1\n"
fi

printf "\n\nCreating google ad manager instance - $http://$1/_components/google-ad-manager/instances/mobileInterstitial...\n\n"
curl -X PUT "$http://$1/_components/google-ad-manager/instances/mobileInterstitial" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
    "adSize": "mobile-interstitial",
    "adPosition": "bottom",
    "adLocation": "atf"
}
';

printf "\nUpdating Layouts...\n\n\n"

layout="_layouts/one-column-layout/instances/general"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/$layout > ./layout.json
node ./layout-update.js "$1" "/$layout";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./layout.json -o /dev/null -s
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s

layout="_layouts/one-column-layout/instances/bare"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/$layout > ./layout.json
node ./layout-update.js "$1" "/$layout";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./layout.json -o /dev/null -s
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s

layout="_layouts/one-column-layout/instances/article"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/$layout > ./layout.json
node ./layout-update.js "$1" "/$layout";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./layout.json -o /dev/null -s
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s

layout="_layouts/two-column-layout/instances/article"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/$layout > ./layout.json
node ./layout-update.js "$1" "/$layout";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./layout.json -o /dev/null -s
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s

rm ./layout.json
