#!/usr/bin/env bash

SCRIPT_DIR=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P)
BACKUPS_DIR="$SCRIPT_DIR/backups"
MODIFIED_DIR="$BACKUPS_DIR/modified"

# create backups and modified directories if they don't already exist
# although the assumption is that the first argument is the name of the file in backups, so that dir should probably
# already exist
mkdir -p "$MODIFIED_DIR"

BACKUP="$BACKUPS_DIR/$1"
MODIFIED="$MODIFIED_DIR/$1"

SEARCH="$2"
REPLACE=${3:-clay.radio.com}
REPLACE_HTTPS=${4:-n}

echo Creating Modified Backup
cp -f "$BACKUP" "$MODIFIED"

# Delete data rows that include clay.radio.com as the id (e.g. start with clay.radio.com)
sed -i '' '/^clay\.radio\.com/d' "$MODIFIED"

if [ "$(echo "$REPLACE_HTTPS" | tr '[A-Z]' '[a-z]')" = "y" ]; then
  sed -i '' "s/https\:\/\/$SEARCH/http:\/\/$REPLACE/g" "$MODIFIED"
fi

# replace all data in backup with the replace value
sed -i '' "s/$SEARCH/$REPLACE/g" "$MODIFIED"


echo "Modified backup created: $MODIFIED"

# The following assumes we are doing this in the root of a local dev environment
# maybe it should be put into a separate script so that different scripts can handle this per env
# besides, the backup may have already been fixed, so why fix it again if not needed.

PG_TEMP="$SCRIPT_DIR/../postgres/data/temp.sql"

# verify that the postgres container is running
if [ "$(docker inspect -f '{{.State.Running}}' clay-radio_postgres_1)" = "false" ]; then
  echo postgres container is not running. Please start it and try again. 1>&2
  exit 1;
fi;

echo Restoring backup

# Copy the backup to the postgres/data
cp -f "$MODIFIED" "$PG_TEMP"

docker-compose exec postgres psql -q -U postgres -d clay -f "/var/lib/postgresql/data/temp.sql"

echo "Modifying uris table (post clean operation to handle base 64 encoded ids)"
docker-compose exec postgres psql -q -U postgres -d clay -c "UPDATE public.uris SET id = '$REPLACE/_uris/'||ENCODE(CONVERT_TO(url, 'UTF-8'), 'BASE64');"

# cleanup after ourselves
unlink "$PG_TEMP"

echo Restore complete!

#docker-compose exec postgres pg_dump -c --if-exists -O -h "cmsdb-write.radio-stg.com" -w -U "dbadmin" cms -f "/var/lib/postgresql/data/backup.sql"
