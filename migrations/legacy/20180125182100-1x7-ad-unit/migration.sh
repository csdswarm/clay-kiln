#! /bin/bash

printf "\n\nCreating google ad manager instance...\n\n"
curl -X PUT "$2://$1/_components/google-ad-manager/instances/mobileInterstitial" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d'
{
    "adSize": "mobile-interstitial",
    "adPosition": "bottom",
    "adLocation": "btf"
}
';

printf "\nUpdating Layouts...\n\n\n"

layout="_components/one-column-layout/instances/general"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $2://$1/$layout > ./layout.json
node ./layout-update.js "$1" "/$layout";
curl -X PUT $2://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./layout.json -o /dev/null -s
curl -X PUT $2://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s

layout="_components/one-column-layout/instances/bare"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $2://$1/$layout > ./layout.json
node ./layout-update.js "$1" "/$layout";
curl -X PUT $2://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./layout.json -o /dev/null -s
curl -X PUT $2://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s

layout="_components/one-column-layout/instances/article"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $2://$1/$layout > ./layout.json
node ./layout-update.js "$1" "/$layout";
curl -X PUT $2://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./layout.json -o /dev/null -s
curl -X PUT $2://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s

layout="_components/two-column-layout/instances/article"
printf "\n\nUpdating $layout...\n\n"
curl -X GET -H "Accept: application/json" $2://$1/$layout > ./layout.json
node ./layout-update.js "$1" "/$layout";
curl -X PUT $2://$1/$layout -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -d @./layout.json -o /dev/null -s
curl -X PUT $2://$1/$layout@published -H 'Authorization: token accesskey' -o /dev/null -s

rm ./layout.json
