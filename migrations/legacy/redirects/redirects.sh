#! /bin/bash

if [ "$#" -ne 2 ]; then
  echo "Arguments required!
  Environment: <clay|dev-clay|stg-clay|www>
  Key: <clay key for import>

  example: ./$(basename "$0").sh clay demo"
else
    [[ $1 = "clay" ]] && http="http" || http="https"
    echo "Using $http://$1.radio.com"
    if [[ $(curl "$http://$1.radio.com/_pages" 2>&1) == *"_pages/redirects"* ]];
    then echo "Redirects page already exists";
    else cat "$(dirname "$0")/redirects.json" | clay import -k $2 --publish "$1.radio.com";
    echo Adding default redirects
    curl -X PUT "http://$1.radio.com/_components/redirects/instances/default?componenthooks=false" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' --data-binary '{"redirects":[{"url":"'"$http://$1"'.radio.com/peterking","redirect":"https://app.radio.com/ota-petetr-king-podcast"},{"url":"'"$http://$1"'.radio.com/pullupwithcj","redirect":"https://app.radio.com/ota-pull-up-with-cj"},{"url":"'"$http://$1"'.radio.com/openfloor","redirect":"https://app.radio.com/ota-open-floor"},{"url":"'"$http://$1"'.radio.com/sportsreporters","redirect":"https://app.radio.com/ota-sports-reporters"},{"url":"'"$http://$1"'.radio.com/wojpod","redirect":"https://app.radio.com/ota-woj-pod"},{"url":"'"$http://$1"'.radio.com/wilder ","redirect":"https://app.radio.com/ota-wilder"},{"url":"'"$http://$1"'.radio.com/insidethehive","redirect":"https://app.radio.com/ota-inside-the-hive"},{"url":"'"$http://$1"'.radio.com/marketsnacks","redirect":"https://app.radio.com/ota-market-snacks"},{"url":"'"$http://$1"'.radio.com/ufcunfiltered","redirect":"https://app.radio.com/ota-ufc-unfiltered"},{"url":"'"$http://$1"'.radio.com/10questions","redirect":"https://app.radio.com/ota-10-questions"},{"url":"'"$http://$1"'.radio.com/theactionnetwork","redirect":"https://app.radio.com/ota-the-action-network"},{"url":"'"$http://$1"'.radio.com/prorata","redirect":"https://app.radio.com/ota-pro-rata"},{"url":"'"$http://$1"'.radio.com/10things","redirect":"https://app.radio.com/ota-10-things"},{"url":"'"$http://$1"'.radio.com/download","redirect":"https://app.radio.com/6cJTEg51XS"},{"url":"'"$http://$1"'.radio.com/listen","redirect":"'"$http://$1"'.radio.com/blogs/how-listen-radio-stations-online-radiocom-faq"},{"url":"'"$http://$1"'.radio.com/devils","redirect":"https://app.radio.com/RGztHdP9RR"},{"url":"'"$http://$1"'.radio.com/newsletter","redirect":"'"$http://$1"'.radio.com/newsletter/subscribe"},{"url":"'"$http://$1"'.radio.com/moochandthemrs","redirect":"https://app.radio.com/WoEKbc5PjQ"}],"componentVariation":"redirects"}'  --compressed >/dev/null 2>&1;
    curl -X PUT "http://$1.radio.com/_pages/redirects@published" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' >/dev/null 2>&1;
    echo Redirects migration completed
   fi
fi


