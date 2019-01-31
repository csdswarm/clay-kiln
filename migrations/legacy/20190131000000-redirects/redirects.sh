#! /bin/bash

if [ "$1" != "" ]; then
  [[ $1 = "clay.radio.com" ]] && http="http" || http="https"
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http";
  printf "No environment specified. Updating environment $http://$1\n"
fi

printf "\n\nUpdating Redirects\n\nUsing $http://$1"
if [[ $(curl "$http://$1/_pages" 2>&1) == *"_pages/redirects"* ]];
then
    printf "\n\nRedirects page already exists\n\n";
else
    cat ./redirects.json | clay import -k demo --publish "$http://$1";
    printf "\n\nAdding default redirects\n"

    curl -X PUT "$http://$1/_components/redirects/instances/default?componenthooks=false" -H 'Authorization: token accesskey' -H 'Content-Type: application/json' --data-binary '{"redirects":[{"path":"/peterking","redirect":"https://app.radio.com/ota-petetr-king-podcast"},{"path":"/pullupwithcj","redirect":"https://app.radio.com/ota-pull-up-with-cj"},{"path":"/openfloor","redirect":"https://app.radio.com/ota-open-floor"},{"path":"/sportsreporters","redirect":"https://app.radio.com/ota-sports-reporters"},{"path":"/wojpod","redirect":"https://app.radio.com/ota-woj-pod"},{"path":"/wilder","redirect":"https://app.radio.com/ota-wilder"},{"path":"/insidethehive","redirect":"https://app.radio.com/ota-inside-the-hive"},{"path":"/marketsnacks","redirect":"https://app.radio.com/ota-market-snacks"},{"path":"/ufcunfiltered","redirect":"https://app.radio.com/ota-ufc-unfiltered"},{"path":"/10questions","redirect":"https://app.radio.com/ota-10-questions"},{"path":"/theactionnetwork","redirect":"https://app.radio.com/ota-the-action-network"},{"path":"/prorata","redirect":"https://app.radio.com/ota-pro-rata"},{"path":"/10things","redirect":"https://app.radio.com/ota-10-things"},{"path":"/download","redirect":"https://app.radio.com/6cJTEg51XS"},{"path":"/listen","redirect":"/blogs/how-listen-radio-stations-online-radiocom-faq"},{"path":"/devils","redirect":"https://app.radio.com/RGztHdP9RR"},{"path":"/newsletter","redirect":"/newsletter/subscribe"},{"path":"/moochandthemrs","redirect":"https://app.radio.com/WoEKbc5PjQ"},{"path":"/watchtazandmoose","redirect":"https://cbssportsradio.radio.com/tazandthemoose"}],"componentVariation":"redirects"}'  --compressed;
    curl -X PUT "$http://$1/_pages/redirects@published" -H 'Authorization: token accesskey' -H 'Content-Type: application/json';
    printf "\n\nRedirects migration completed\n\n"
fi
