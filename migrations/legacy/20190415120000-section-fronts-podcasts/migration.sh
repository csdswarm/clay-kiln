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

printf "Add new podcast module instances...\n"
cat ./_components.yml | clay import -k demo -y -p $1

printf "\nUpdating Section Fronts to Add Podcast Modules...\n\n"

# _components/section-front/instances/sports
componentType="section-front"
instanceType="sports"
printf "\n\nUpdating component $componentType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./section-fronts-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"

# _components/section-front/instances/music
componentType="section-front"
instanceType="music"
printf "\n\nUpdating component $componentType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./section-fronts-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"

# _components/section-front/instances/news
componentType="section-front"
instanceType="news"
printf "\n\nUpdating component $componentType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./section-fronts-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"

# _components/section-front/instances/small-business-pulse
componentType="section-front"
instanceType="small-business-pulse"
printf "\n\nUpdating component $componentType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./section-fronts-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"
