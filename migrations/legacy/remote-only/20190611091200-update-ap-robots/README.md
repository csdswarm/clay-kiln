# Instructions

To run this migration, navigate to this directory in a bash terminal window and type `./migration.sh targetEnvironment`

Where `targetEnvironment` is blank (defaults to `clay.radio.com`), or `targetEnvironment` is the environment you wish to 
update (e.g. `dev-clay.radio.com`, `www.radio.com`, etc)

example:

```bash
./migration.sh dev-clay.radio.com
```

`make bootstrap` will run this migration automatically for `clay.radio.com`, however, at bootstrap time there won't be 
anything to update yet, so it basically won't do anything. 

If you want to test this out locally, you can run the following command first in a terminal:

```bash
cat import-clay.txt | while read url; do clay export -k demo $url | clay import -p -k demo clay.radio.com; done;
./migration.sh 
```

Where import-clay.txt is a list of urls that contain articles with "The Associated Press" in the byline.

As sample has been included, however, you can put whatever urls you wish to test in it, just don't commit
any updates to that file. 

# Finding and fixing Errors

If any errors occurred when running this migration, they will be placed into an `errors.log` file in this 
directory. Please check for errors after running this migration as some items may not have migrated as a result. 
