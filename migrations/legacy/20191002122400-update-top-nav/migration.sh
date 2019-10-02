#! /bin/bash

scriptdir="$(dirname "$0")"
cd "$scriptdir"

node migration.js $1
