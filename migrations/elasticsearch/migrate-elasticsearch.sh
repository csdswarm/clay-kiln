#! /bin/bash

# Script to migrate from one elasticsearch cluster to another
# Examples:
#   All data - ./migrate https://vpc-prdcms2-elasticsearch-nigdljt33pc6yi6rr4ijbheqbu.us-east-1.es.amazonaws.com http://localhost:9200
#   Single index = ./migrate https://vpc-prdcms2-elasticsearch-nigdljt33pc6yi6rr4ijbheqbu.us-east-1.es.amazonaws.com http://localhost:9200 published-content_v14

if [ -z $1 ] ; then
  echo "Must provide location of current Elasticsearch" && exit 1;
fi
fromElastic=$1;

if [ -z $2 ] ; then
  echo "Must provide location of new Elasticsearch" && exit 2;
fi
toElastic=$2;

package='elasticdump'
if [ `npm list -g | grep -c $package` -eq 0 ]; then
    npm install -g $package --no-shrinkwrap
fi

if [ -z $3 ] ; then
	curl "$1/_cat/indices?v&s=index:desc&format=json" | jq -r '.[].index' | while read index ; do
		echo "Porting settings - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=settings
		echo "Porting mapping - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=mapping
		echo "Porting data - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=data --limit=1000
	done
	echo "Setup aliases"
	curl "$1/_cat/aliases?v&s=index:desc&format=json" | jq -r '.[].index' | while read index ; do
		echo "Porting settings - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=settings
		echo "Porting mapping - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=mapping
		echo "Porting data - $1/$index to $2/$index"
		elasticdump --input=$1/$index --output=$2/$index --type=data --limit=1000
	done
else
	index=$3;
	aliasMatch="(.*)_v[1-9]+"
	echo "Porting settings - $1/$index to $2/$index"
	elasticdump --input=$1/$index --output=$2/$index --type=settings
	echo "Porting mapping - $1/$index to $2/$index"
	elasticdump --input=$1/$index --output=$2/$index --type=mapping
	echo "Porting data - $1/$index to $2/$index"
	elasticdump --input=$1/$index --output=$2/$index --type=data --limit=1000
	if [[ $index =~ (.*)_v[1-9]+ ]]; then
		alias=${BASH_REMATCH[1]};
		echo "$alias"
		curl "$1/_cat/aliases/$alias?v&s=index:desc&format=json" | jq -r '.[].alias' | while read alias ; do
			echo "Porting alias - $1/$alias to $2/$alias"
			elasticdump --input=$1/$alias --output=$2/$alias --type=alias
		done
	fi
fi
