# import_db.sh

Takes a sql backup file from an external DB such as dev, stg or prod and imports it into the local clay postgres


```shell script
import_db file_name search [replace] [remove https]
```

## Arguments

__file_name__  - required: string of the file name added to the utility/backups directory

__search__ - required: regex string search pattern for the source host string e.g. stg-clay\.radio\.com

__replace__ - optional: string to replace the search pattern with. Defaults to clay.radio.com

__remove https__ - optional: `y` or `n` to indicate if original urls with https in them such as
  `https://www.radio.com/...` should be converted to http such as `http://clay.radio.com/...` Defaults to `n`

## Usage
The docker postgres container must be running to use this

Copy your backup file into `utility/backups` (_backups may not yet exist if this is the first time you are using this_)

ex (assumes you are in the root of the project and your backup was downloaded to your Downloads folder): 

```shell script
cp ~/Downloads/myBak.sql "utility/backups/"
```

Next run the importer ()

This example shows setting the remove https flag to true
```shell script
./utility/import_db.sh myBak.sql www\.radion\.com "" y
```

This will restore the local `clay` database with all references to `www.radio.com` changed to `clay.radio.com` and any
   instances of `https://www.radio.com` replaced with `http://clay.radio.com`
