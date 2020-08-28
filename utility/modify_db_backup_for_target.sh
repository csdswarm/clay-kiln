#!/usr/bin/env bash

SCRIPT_DIR=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P)

# create backups and modified directories if they don't already exist
# although the assumption is that the first argument is the name of the file in backups, so that dir should probably
# already exist
mkdir -p "$SCRIPT_DIR/backups"

# get absolute path of file
FILE_NAME="$( basename "$1" )"
FILE_PATH="$( cd "${1%/*}"; pwd -P )"

SEARCH=${2:-www\.radio\.com}
REPLACE_HTTPS=${3:-n}
REPLACE=${4:-clay.radio.com}
DB=${5:-clay}

# If the file was zipped first, unzip it in place
if [[ $FILE_NAME =~ .bz2?$ ]]; then
  echo "Extracting bzip"
  bunzip2 "$FILE_PATH/$FILE_NAME"
  FILE_NAME="${FILE_NAME%.*}"
elif [[ $FILE_NAME =~ .gz$ ]]; then
  echo "Extracting gzip"
  gunzip "$FILE_PATH/$FILE_NAME"
  FILE_NAME="${FILE_NAME%.*}"
fi

BACKUP="$FILE_PATH/$FILE_NAME"
MODIFIED="$SCRIPT_DIR/backups/modified_$FILE_NAME"

echo Creating Modified Backup
cp -f "$BACKUP" "$MODIFIED"

# Delete data rows that include clay.radio.com as the id (e.g. start with clay.radio.com)
sed -i '' '/^clay\.radio\.com/d' "$MODIFIED"

if [ "$(echo "$REPLACE_HTTPS" | tr '[A-Z]' '[a-z]')" = "y" ]; then
  sed -i '' "s/https\:\/\/$SEARCH/http:\/\/$REPLACE/g" "$MODIFIED"
fi

# replace all data in backup with the replace value
sed -i '' "s/$SEARCH/$REPLACE/g" "$MODIFIED"

# add an update query to the end of the SQL file to handle reencoding the uris table
echo "UPDATE public.uris SET id = REPLACE('$REPLACE/_uris/'||ENCODE(CONVERT_TO(url, 'UTF-8'), 'BASE64'), E '\n', '');" >> "$MODIFIED"

echo "Modified backup created: $MODIFIED."
