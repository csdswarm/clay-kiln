# Backing up the DB

This should be handled automatically and recent backups can be downloaded from ... TBD ...

The backup can generally be handled from any environment that contains `pg_dump`. The following is in a format that the
following scripts expect, in order to make modifications to the result.

PGPASSWORD="password" pg_dump -h "host" -U user -O -d db -f "/path/to/data/backup.sql"

The values: password, host, user and db would need to be replaced with the actual values belonging to the db to back up.

Backing up a DB can be a long process and may cause slowness for any system that uses that DB, so please do not backup
large DBs at times that will negatively impact production, testing or development. Again, this should be an automated 
process that is already being handled elsewhere. The reason for this documentation is primarily to clear up expectations.

# modify_db_backup_for_target.sh

Takes an existing sql backup file from an external DB such as dev, stg or prod and modifies it up for another 
  environment (local/clay.radio.com by default)

```shell
./modify_db_backup_for_target.sh $file_name [$search] [$remove_https] [$target] [$db]
```

## Arguments

__file_name__ - required: the path of the file to modify. The modified file will be added to the utility/backups folder.

__search__ - optional: regex string search pattern for the source host string e.g. stg-clay\\.radio\\.com. 
             (default is www\\.radio\\.com)

__remove_https__ - optional: `y` or `n` to indicate if original urls with https in them such as
  `https://www.radio.com/...` should be converted to http such as `http://clay.radio.com/...` (Defaults to `n`)

__target__ - optional: string to replace the search pattern with. (Defaults to clay.radio.com)

__db__ - optional: string, name of the db to restore as, default is clay. 
        (NOTE: Whatever db you indicate must already exist in the local postgres instance)


## Usage
The docker postgres container must be running to use this


ex (assumes you are in the root of the project, and your backup is in your Downloads folder): 

```shell
utility/modify_db_backup_for_target.sh ~/Downloads/prod_2020_04_01_03_30_45_000.sql
```

The above script will find a backup called `prod_2020_04_01_03_30_45_000.sql` in your downloads folder, copy it to 
`utility/backups/modified_prod_2020_04_01_03_30_45_000.sql` and replace all instances of `www.radio.com` with 
`clay.radio.com`

It will also append a script that handles converting the base64 encoded urls when the db is restored.

Here are some other examples:

extract to a db called cms location and change `https://` to `http://` 

```shell
utility/modify_db_backup_for_target.sh ~/Downloads/myBak.sql "" y "" cms
```

Assuming the backup came from stage and not prod the following will extract to a db called `sbx` 
and replace `stg-clay.radio.com` with `sandbox.radio.com`. `https` will not be converted to `http`

```shell
utility/modify_db_backup_for_target.sh ~/Downloads/myBak.sql "stg\-clay\.radio\.com" n "sandbox.radio.com" sbx
```

# restore_db.sh

Restores the DB that was created using `modify_db_backup_for_target.sh`

example (this assumes you are in the root of the project, you have run `modify_db_backup_for_target.sh` already and have
         a modified db in your `utility/backups` folder):

This will restore the script to the `clay` db

```shell
utility/restore_db.sh utility/backups/modified_myBak.sql
```


This will restore the script to the `cms` db

```shell
utility/restore_db.sh utility/backups/modified_myBak.sql cms
```
