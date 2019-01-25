#! /bin/bash
mydir="$(dirname "${0}")"

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

printf "\n\nCreating google ad manager instance...\n\n"
curl -X PUT "$http://$1/_components/google-ad-manager/instances/mobileInterstitial" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
    "adSize": "mobile-interstitial",
    "adPosition": "bottom",
    "adLocation": "btf"
}
';

printf "\nUpdating Layouts...\n\n\n"

layout="_components/one-column-layout/instances/general"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/$layout > $mydir/layout.json
node $mydir/layout-update.js "$1" "/$layout";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @$mydir/layout.json
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey'

layout="_components/one-column-layout/instances/bare"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/$layout > $mydir/layout.json
node $mydir/layout-update.js "$1" "/$layout";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @$mydir/layout.json
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey'

layout="_components/one-column-layout/instances/article"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/$layout > $mydir/layout.json
node $mydir/layout-update.js "$1" "/$layout";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @$mydir/layout.json
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey'

layout="_components/two-column-layout/instances/article"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/$layout > $mydir/layout.json
node $mydir/layout-update.js "$1" "/$layout";
curl -X PUT $http://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @$mydir/layout.json
curl -X PUT $http://$1/$layout@published -H 'Authorization: token accesskey'

rm $mydir/layout.json
