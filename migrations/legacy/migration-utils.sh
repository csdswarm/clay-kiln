#! /bin/bash

function logMigrationDivider {
    migrationMsg=$1
    printf "\n\n============== %s ==============\n\n" "${migrationMsg}"
}

function setClayEnvironment() {
    if [ "$1" != "" ]; then
        if [ "$1" == "clay.radio.com" ]; then
            es="$1" && protocol="http"
        elif [ "$1" == "dev-clay.radio.com" ]; then
            es="http://dev-es.radio-dev.com" && protocol="https"
        elif [ "$1" == "stg-clay.radio.com" ]; then
            es="http://es.radio-stg.com" && protocol="https"
        elif [ "$1" == "www.radio.com" ]; then
            es="http://es.radio-prd.com" && protocol="https"
        fi
        printf "Updating environment $protocol://$1\n"
    else
        set "clay.radio.com" && protocol="http" && es="$1"
        printf "No environment specified. Updating environment $protocol://$1\n\n"
    fi
}

function importPageFromYaml {
    yml=$1
    env=$es
    printf "Importing page YML from... %s\n" "${yml}"
    printf "To environment... %s\n\n\n" "${env}"
    cat $yml | clay import -k demo -y $env
}