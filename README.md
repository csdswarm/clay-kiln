#     Clay Starter

A repo that contains a basic site and the necessary files to provision AWS resources for hosting the site.

## To Start

Make sure you have docker installed.

Edit your `/etc/hosts` file to include the following:

```
127.0.0.1 clay.radio.com
```

Create a .clayconfig file in your home folder

Add the following to the file and save
```
[keys]
  demo = accesskey
[urls]
  demosite = http://clay.radio.com
```
## Local Development

You'll probably want two windows in your terminal open for now.

### Terminal Window 1

In the directory where you would like to serve the project clone the following repos:
```
git clone git@bitbucket.org:entercom/frequency-clay-translator.git
```
```
git clone git@bitbucket.org:entercom/clay-radio.git
```

Within frequency-clay-translator run
```
npm install
``` 
Within the clay-radio folder run

```bash
make install-dev
```

This is to make sure your `public` directory exists. Without it the site won't run.

Initially you'll need to build the clay image and you'll run it any time node packages are updated
```
make up-clay
```
When this completes and you see something similar to this:
```
INFO [2019-04-30T15:06:08.577Z] (clay/48 on 88d11227ae33): Clay listening on 0.0.0.0:3001 (process 48)
```

Kill the process (ctrl-c)

This is where the app will actually be run from. Make sure you're not running `sites` Clay instance.

```bash
make up
```

This is going to spin up a Redis, ElasticSearch and Clay instance. The Clay image will be built using the `Dockerfile` in the `app/` directory. The directories for `components`, `sites`, `services` and `public` are mounted into the container, which is why you'll run Gulp from your host machine.

The container should be running `nodemon`, so changes to files will be detected. You MAY have to restart your container when adding a new component, but maybe not. If that's the case, submit an issue.

When you see something like this your server should be running locally
```
INFO [2019-04-30T15:06:08.577Z] (clay/48 on 88d11227ae33): Clay listening on 0.0.0.0:3001 (process 48)
```

### Terminal Window 2

Navigate to the root of the project, where the `Makefile` exists.

This is the window where you'll re-run Gulp as you need to. Right now only the tasks for building model.js, template files and CSS.

If this the initial set up of clay you'll need to populate content by running (more detail is found below)

#### Bootstrapping Data

1. Install [claycli](https://github.com/clay/claycli)
2. Configure your [`.clayconfig` file](https://github.com/clay/claycli#usage). It'll go at `~/.clayconfig` and you'll want to add the following:
    ```
    [keys]
      demo = accesskey
    [urls]
      demosite = http://clay.radio.com
    ```
3. Now you can run `make bootstrap` which will put the `app/first-run` data into your local instance.
    ```
    make bootstrap
    ```


#### When do I need to restart?

If you `npm install` a new package, you'll need to build a new image. This has been captured in a Makefile command

```bash
make up-clay
```
You can run this without stopping anything and it'll swap in a new container with the new image to all the services, but you'll need to get the logs back again by running the log command.

#### When do I need to rebuild the SPA?

If you change any `template.hbs` files in the components or any files in `spa/`, add media elements or create new Handlebar helpers you'll need to re-build the SPA. This has been captured in a Makefile command

```bash
make spa
```

#### When do I need to run gulp?

If you change any files in the following (Pulled from `app/gulpfile.js`): 
* `styleguides/**/*.css`
* `global/js/**` (Not in `/global/js/editor` though)
* `global/kiln/**/*.js`
* `components/**/media/**`
* `sites/**/media/**`
* `sites/**/fonts/**`
* `components/**/*.hbs` or `components/**/*.handlebars`

Run the following command from inside the `app/` directory:
```bash
npx gulp
```

Gulp can also be watched to automatically rebuild changes:
```bash
npx gulp watch
```

### If I want to stop dev?

```bash
make down
```

### Clearing out local data?

```bash
make clear-data
```

## Adding Users

A bootstrap file for users looks like the following:

```yaml
_users:
  -
    username: <USER_EMAIL>
    provider: <AUTH_PROVIDER>
    auth: <AUTH_LEVEL>
```

- `USER_EMAIL`: the email address of the user
- `AUTH_PROVIDER`: the OAuth/LDAP provider you're using. You're provider will require environment variables for configuration and those docs need to be written. When a more robust configuration is needed please reach out and we'll get that. This project is setup to use `google` as an auth provider by default.
- `AUTH_LEVEL`: either `write` or `admin`

Sample users might look like:

```yaml
_users:
  -
    username: jon.winton@nymag.com
    provider: google
    auth: admin
  -
    username: jwinton
    provider: ldap
    auth: write
```

## Running the importer

You will need to run the importer (Will create pages and import 10 items from each content type (articles/blogs/etc))

```bash
git clone git@bitbucket.org:entercom/frequency-clay-translator.git
cd frequency-clay-translator
npm run import-pages --silent
npm run import-content --silent totalItems=10
```

For further instructions please see README.md in ```frequency-clay-translator```

## Running the demo

Now you can visit the following URL to get a list of test pages you can visit.

http://clay.radio.com/_pages/index.html

## Rebuild the SPA

Anytime you change a `template.hbs` file  or modify the `spa` directory, run
`npm run-script build -- --mode=none` from the `spa` directory.

## Missed anything?
That _should_ be it...if not, submit an issue or add something to this README.w

## TODO:
- Demo user
- Pretty url (for auth)
