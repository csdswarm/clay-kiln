#! /bin/bash

# Script to migrate from one elasticsearch cluster to another
# Examples:
#   All data - ./migrate https://vpc-prdcms2-elasticsearch-nigdljt33pc6yi6rr4ijbheqbu.us-east-1.es.amazonaws.com http://localhost:9200 clay.radio.com
#   Single index = ./migrate https://vpc-prdcms2-elasticsearch-nigdljt33pc6yi6rr4ijbheqbu.us-east-1.es.amazonaws.com http://localhost:9200 clay.radio.com published-content_v14

if [ -z $1 ] ; then
  echo "Must provide location of current Elasticsearch" && exit 1;
fi
fromElastic=$1;

if [ -z $2 ] ; then
  echo "Must provide location of new Elasticsearch" && exit 2;
fi
toElastic=$2;

if [ -z $3 ] ; then
  echo "Must provide hostname of new Site" && exit 2;
fi
toHostname=$3;

package='elasticdump'
if [ `npm list -g | grep -c $package` -eq 0 ]; then
    npm install -g $package --no-shrinkwrap
fi

if [ -z $4 ] ; then
	curl "$1/_cat/indices?v&s=index:desc&format=json" | jq -r '.[].index' | while read index ; do
		echo "Porting settings - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=settings
		if [ $? -ne 0 ]; then { echo "Failed, aborting." ; exit 1; } fi
		echo "Porting mapping - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=mapping
		if [ $? -ne 0 ]; then { echo "Failed, aborting." ; exit 1; } fi
		echo "Porting data - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=data --limit=500 --transform=@./migrate-elastic-transform.js?hostname=$toHostname
		if [ $? -ne 0 ]; then { echo "Failed, aborting." ; exit 1; } fi
	done
	echo "Setup aliases"
	curl "$1/_cat/aliases?v&s=index:desc&format=json" | jq -r '.[].index' | while read index ; do
		echo "Porting settings - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=settings
		if [ $? -ne 0 ]; then { echo "Failed, aborting." ; exit 1; } fi
		echo "Porting mapping - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=mapping
		if [ $? -ne 0 ]; then { echo "Failed, aborting." ; exit 1; } fi
		echo "Porting data - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=data --limit=500 --transform=@./migrate-elastic-transform.js?hostname=$toHostname
	done
else
	index=$4;
	aliasMatch="(.*)_v[1-9]+"
	echo "Porting settings - $1/$index to $2/$index"
	elasticdump --input=$1/$index --output=$2/$index --type=settings
	if [ $? -ne 0 ]; then { echo "Failed, aborting." ; exit 1; } fi
	echo "Porting mapping - $1/$index to $2/$index"
	elasticdump --input=$1/$index --output=$2/$index --type=mapping
	if [ $? -ne 0 ]; then { echo "Failed, aborting." ; exit 1; } fi
	echo "Porting data - $1/$index to $2/$index"
	elasticdump --input=$1/$index --output=$2/$index --type=data --limit=500 --transform=@./migrate-elastic-transform.js?hostname=$toHostname
	if [ $? -ne 0 ]; then { echo "Failed, aborting." ; exit 1; } fi
	if [[ $index =~ (.*)_v[1-9]+ ]]; then
		alias=${BASH_REMATCH[1]};
		echo "$alias"
		curl "$1/_cat/aliases/$alias?v&s=index:desc&format=json" | jq -r '.[].alias' | while read alias ; do
			echo "Porting alias - $1/$alias to $2/$alias"
			elasticdump --input=$1/$alias --output=$2/$alias --type=alias
			if [ $? -ne 0 ]; then { echo "Failed, aborting." ; exit 1; } fi
		done
	fi
fi
