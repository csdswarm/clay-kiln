# fix_db_and_import.sh

Takes a sql backup file from an external DB such as dev, stg or prod and imports it into the local clay postgres


```shell script
./fix_db_and_import.sh $file_name [$search] [$remove_https] [$replace] [$db]
```

## Arguments

__file_name__  - required: string of the file name added to the utility/backups directory

__search__ - optional: regex string search pattern for the source host string e.g. stg-clay\.radio\.com. default is www\.radio\.com

__remove_https__ - optional: `y` or `n` to indicate if original urls with https in them such as
  `https://www.radio.com/...` should be converted to http such as `http://clay.radio.com/...` Defaults to `n`

__replace__ - optional: string to replace the search pattern with. Defaults to clay.radio.com

__db__ - optional: string, name of the db to restore as, default is clay. (NOTE: Whatever db you indicate must already exist in the local postgres instance)



## Usage
The docker postgres container must be running to use this


ex (assumes you are in the root of the project and your backup was downloaded to your Downloads folder): 

```shell script
utility/fix_db_and_import.sh ~/Downloads/myBak.sql
```

The above script will find a backup called `myBak.sql` in your downloads folder, copy it to `utility/backups/modified_myBak.sql`
and replace all instances of `www.radio.com` with `clay.radio.com`

It will also append a script that handles converting the base64 encoded urls when the db is restored.

As soon as it is finished, it will then run import_db.sh on the file with the DB you specified to restore to.

Here are some other examples:

extract to a db called cms location and change `https://` to `http://` 
```shell script
utility/fix_db_and_import.sh ~/Downloads/myBak.sql "" y "" cms
```

Assuming the backup came from stage and not prod the following will extract to a db called `sbx` 
and replace `stg-clay.radio.com` with `sandbox.radio.com`. `https` will not be converted to `http`
```shell script
utility/fix_db_and_import.sh ~/Downloads/myBak.sql "stg\-clay\.radio\.com" n "sandbox.radio.com" sbx
```

# import_db.sh

If you have already run the fixer already, there is no need to fix the original file again.

at this point, you can simply restore the modified db. You can specify a different db to extract to, however

ex (assumes you are in the root of the project, you have run `fix_db_and_import.sh` already and have a modified db in your `utility/backups` folder):

This will restore the script to the `clay` db
```shell script
utility/import_db.sh utility/backups/modified_myBak.sql
```


This will restore the script to the `cms` db
```shell script
utility/import_db.sh utility/backups/modified_myBak.sql cms
```
