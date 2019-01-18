#! /bin/bash

printf "\nUpdating Section Fronts for Small Business Pulse...\n\n\n"

printf "Updating page...\n"
cd ./migrations/legacy/SBP && cat ./_pages.yml | clay import -k demo -y radio.com

printf "\n\nUpdating component instance...\n\n"
curl -X PUT https://radio.com/_components/section-lead/instances/new -H 'Authorization: token accesskey' -H 'Content-Type: application/json'

printf "\n\n\n\n"
