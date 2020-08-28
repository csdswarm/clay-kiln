#!/usr/bin/env bash

SCRIPT_DIR=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P)
PG_TEMP="$SCRIPT_DIR/../postgres/data/temp.sql"

# get absolute path of target
MODIFIED="$( cd "${1%/*}"; pwd -P )/$( basename "$1" )"

DB=${2:-clay}

# verify that the postgres container is running
POSTGRES_ID="$(docker ps -aq --filter name=^$(basename $(pwd)_postgres))"

if [ "$(docker inspect -f '{{.State.Running}}' "$POSTGRES_ID")" = "false" ]; then
  # send an error message to stderr and exit with a non-0 exit #
  echo postgres container is not running. Please start it and try again. 1>&2
  exit 1;
fi;

echo Beginning Restore

# Copy the backup to the postgres/data
echo Copied backup to docker data folder
cp -f "$MODIFIED" "$PG_TEMP"

echo Disconnecting all users
# make sure to disconnect all users or we won't be able to drop and recreate our db (make sure to set the db to postgres so we aren't connected to the target when we try to disconnect everyone)
docker-compose exec postgres psql -U postgres -c "UPDATE pg_database SET datallowconn='false' WHERE datname='$DB'; SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB' AND pid <> pg_backend_pid();" -d postgres > /dev/null 2>&1

echo Cleaning up and/or creating new dbs as needed.
# drop and recreate the existing DB first to clear it. May error out if db does not exist, but this does not matter
docker-compose exec postgres dropdb -U postgres "$DB" > /dev/null 2>&1
docker-compose exec postgres createdb -U postgres "$DB" > /dev/null 2>&1

echo Restoring the data
docker-compose exec postgres psql -q -U postgres -f "/var/lib/postgresql/data/temp.sql" "$DB" > /dev/null 2>&1

echo cleaning up
# cleanup after ourselves
rm -f "$PG_TEMP"

echo Restore complete!
