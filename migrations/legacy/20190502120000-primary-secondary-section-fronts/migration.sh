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

# printf "Add new section front lists...\n"
cat ./_lists.yml | clay import -k demo -y $1

printf "\n\nResetting data for new instance of podcast list"
curl -X PUT $http://$1/_components/podcast-list/instances/new -H 'Authorization: token accesskey' -H 'Content-Type: application/json' -o /dev/null -s -d '{ "items": [] }'

printf "\nUpdating More Content Feed Instance Section Front to remove sectionFrontManual value...\n\n"
# _components/more-content-feed/instances/section-front
componentType="more-content-feed"
instanceType="section-front"
printf "\n\nUpdating component $componentType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./more-content-feed-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"

printf "\nUpdating Section Fronts to Add Podcast Modules...\n\n"
# _components/section-front/instances/new
componentType="section-front"
instanceType="new"
printf "\n\nUpdating component $componentType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./section-front-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"

# _components/section-front/instances/new
componentType="section-front"
instanceType="new"
printf "\n\nUpdating component $componentType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./section-front-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"

# _components/section-front/instances/sports
componentType="section-front"
instanceType="sports"
printf "\n\nUpdating component $componentType instance $instanceType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_components/$componentType/instances/$instanceType > ./$componentType-$instanceType.json
node ./section-front-update.js "$1" "$componentType" "$instanceType";
cat ./$componentType-$instanceType.yml | clay import -k demo -y $1 -p
rm ./$componentType-$instanceType.json
rm ./$componentType-$instanceType.yml
printf "\n\n\n\n"

printf "\nUpdating New Pages to Add Section Front...\n\n"

# _lists/new-pages
listType="new-pages"
printf "\n\nUpdating _lists instance $listType...\n\n"
curl -X GET -H "Accept: application/json" $http://$1/_lists/$listType > ./lists-$listType.json
node ./new-pages-update.js "$1" "$listType";
cat ./lists-$listType.yml | clay import -k demo -y $1
rm ./lists-$listType.json
rm ./lists-$listType.yml
printf "\n\n\n\n"

# find out which index is currently being used
printf "\nmaking curl GET to $es/published-content/_alias\n";
curl -X GET "$es/published-content/_alias" > ./aliases.json;
currentIndex=$(node alias "$1");
rm ./aliases.json

mappings=$(curl -X GET "$es/$currentIndex/_mappings" 2>/dev/null | sed -n "s/{\"$currentIndex\":{\(.*\)}}/\1/p");

if [[ $mappings == *"secondaryArticleType"* && $mappings != *"secondarySectionFront"* ]]; then
  printf "\nmaking curl GET to $es/_cat/indices?pretty&s=index:desc\n";
  indices=$(curl -X GET "$es/_cat/indices?pretty&s=index:desc" 2>/dev/null);
  # sometimes the currentIndex isn't necessarily the largest. and query brings back in alphabetical order, so 2 > 10
  largestIndex=$(node largest-index "$1" "$indices");

  # increment largetIndex by 1 to create newIndex
  num=$(echo $largestIndex | sed 's/[^0-9]*//g');
  newIndex="$(echo $largestIndex | sed 's/[0-9]*//g')$((num+1))";

  # assuming this is fixed
  alias="published-content";

  printf "\n\nCreating new index ($newIndex)...\n\n"
  curl -X GET "$es/$currentIndex/_settings" > ./settings.json;
  node ./settings-update.js "$1";
  settings=$(cat ./settings.txt);

  echo $mappings > ./mappings.json;
  currentKey="secondaryArticleType";
  newKey="secondarySectionFront";
  newMappings=$(sed s/$currentKey/$newKey/ ./mappings.json);

  curl -X PUT "$es/$newIndex" -H 'Content-Type: application/json' -d "{$settings,$newMappings}";
  rm ./settings.json ./settings.txt ./mappings.json;

  printf "\r\n\r\nCopying old index data ($currentIndex) to new index ($newIndex)...\n\n"
  curl -X POST "$es/_reindex" -H 'Content-Type: application/json' -d "
  {
    \"source\": {
      \"index\": \"$currentIndex\"
    },
    \"dest\": {
      \"index\": \"$newIndex\"
    },
    \"script\": {
      \"inline\": \"ctx._source['secondarySectionFront'] = ctx._source.remove('secondaryArticleType');\"
    }
  }";

  sleep 1;

  printf "\n\nRemoving old alias and adding new ($alias)...\n\n"
  curl -X POST "$es/_aliases" -H 'Content-Type: application/json' -d "
  {
      \"actions\" : [
          { \"remove\" : { \"index\" : \"$currentIndex\", \"alias\" : \"$alias\" } },
          { \"add\" : { \"index\" : \"$newIndex\", \"alias\" : \"$alias\" } }
      ]
  }";
else
  printf "\n\nNo need to reindex. Field $newKey exists.\n\n\n\n";
fi
