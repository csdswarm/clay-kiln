#! /bin/bash
mydir="$(dirname "${0}")"

## Legacy scripts should be listed here to run in order they are intended to

if [ "$1" != "" ]; then
  if [ "$1" == "clay.radio.com" ]; then
    es="$1:9200" && http="http";
  elif [ "$1" == "dev-clay.radio.com" ]; then
    es="http://dev-es.radio-dev.com:9200" && http="https";
  elif [ "$1" == "stg-clay.radio.com" ]; then
    es="http://es.radio-stg.com:9200" && http="https";
	elif [ "$1" == "radio.com" ]; then
    es="https://vpc-prdcms-elasticsearch-c5ksdsweai7rqr3zp4djn6j3oe.us-east-1.es.amazonaws.com:443" && http="https";
  fi
  printf "Updating environment $http://$1\n"
else
  set "clay.radio.com" && http="http" && es="$1:9200";
  printf "No environment specified. Updating environment $http://$1\n"
fi

# Loop over all directories here and find .sh script to execute
for dir in $mydir/*/; do
    cd "$dir"
    for filename in *.sh; do
        # Don't pass variables between scripts
        # https://stackoverflow.com/questions/9772036/pass-all-variables-from-one-shell-script-to-another/28490273#28490273
        (source $filename $1 $http $es)
    done
    cd ../../../
done
