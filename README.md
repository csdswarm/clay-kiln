# Clay Starter

A repo that contains a basic site and the necessary files to provision AWS resources for hosting the site.

## Prerequisites:

* [Docker desktop](https://www.docker.com/products/docker-desktop)
* [Homebrew](https://brew.sh/)
    * quick install: `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`
* [mkcert](https://github.com/FiloSottile/mkcert)
    * quick install: `brew install mkcert && brew install nss`

## To Start

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
  demosite = https://clay.radio.com
```
## Local Development

You'll probably want two windows in your terminal open for now.

### Terminal Window 1

In the directory where you would like to serve the project, clone the following repos:
```
git clone git@bitbucket.org:entercom/frequency-clay-translator.git
```
```
git clone git@bitbucket.org:entercom/clay-radio.git
```

It is relevant to have both folders at the same level. The final folders structure should look like this:

```
├── root-folder
│   ├── clay-radio
│   └── frequency-clay-translator
```

Within frequency-clay-translator run
```
npm install
```

Within clay-radio run
```
npm install
```

**Note:** prior to running the next command, consider if you are starting from scratch or not. **If not**, it is recommended to run at this point the `make nuke` command within the clay-radio folder. This will eventually:

1. Installed dependencies.
2. Docker images.
3. Information created in the boostrap process.
4. Log files.

Within the clay-radio folder run

```bash
make gen-certs
```

This generates the TLS/SSL certs needed to access the site locally over https.

Also run

```bash
make up-nginx
```

To ensure that the nginx container gets the new certs.

If you would like SSL to run with a local CA, so that you are not warned that the SSL might not be
trustworthy, run the following command (it only needs to be run once on your machine):

```bash
mkcert -install
```

Then run
```bash
make install-dev
```

Install jq yq and golang
```bash
brew install jq yq golang
```

Install sops
```bash
brew install sops
```

Install `aws-cli` - https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html

Setup profile - https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html#cli-quick-configuration
Use AWS credentials for your account and use the `default` profile. If you have multiple profiles update the below script accordingly.

Add the following script to your local `~/.bashrc` file (UPDATE THE EMAIL ADDRESS TO BE YOURS):
```bash
if [ -f ~/.aws_token ]; then
    filemtime=$(stat -f%m ~/.aws_token)
    currtime=$(date +%s)
    diff=$(( currtime - filemtime ))
    if (( diff < 43200 )); then
        . ~/.aws_token
    else
        echo "AWS Token has expired, rerun 'token' to activate."
    fi
fi
function token(){
    token_info=$(aws sts get-session-token --serial-number arn:aws:iam::477779916141:mfa/[EMAIL_FOR_YOUR_AWS_ACCOUNT] --profile default --query Credentials --duration-seconds 129600 --token-code $1)
    echo "export AWS_ACCESS_KEY_ID=$(echo $token_info | jq -r .AccessKeyId)" > ~/.aws_token
    echo "export AWS_SECRET_ACCESS_KEY=$(echo $token_info | jq -r .SecretAccessKey)" >> ~/.aws_token
    echo "export AWS_SESSION_TOKEN=$(echo $token_info | jq -r .SessionToken)" >> ~/.aws_token
    source ~/.aws_token
}
```

Create local .env file inside the `clay-radio/app` folder
```bash
token [INSERT_TOKEN_FROM_MFA_DEVICE]
make generate-local-env
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

If this the initial set up of clay you'll need to populate content by running the bootstrapping data steps below:

#### Bootstrapping Data

1. Install [claycli](https://github.com/clay/claycli)
2. Configure your [`.clayconfig` file](https://github.com/clay/claycli#usage). It'll go at `~/.clayconfig` and you'll want to add the following:
    ```
    [keys]
      demo = accesskey
    [urls]
      demosite = https://clay.radio.com
    ```
3. Now you can run `make bootstrap` which will put the `app/first-run` data into your local instance.
    ```
    make bootstrap
    ```

**Note:**  running `make bootstrap` multiple times will cause several issues. This command is meant to be executed just once.

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

#### When do I need to run clay compile?

If you change any files in the following (Pulled from `app/gulpfile.js`):
* `styleguides/**/*.css`
* `global/js/**` (Not in `/global/js/editor` though)
* `global/kiln/**/*.js`
* `components/**/media/**`
* `sites/**/media/**`
* `services/**/fonts/**`
* `components/**/*.hbs` or `components/**/*.handlebars`

Run the following command from inside the `app/` directory:
```bash
$ npm run build
```

Clay can also be watched to automatically rebuild changes:
```bash
$ npm run watch
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

https://clay.radio.com/_pages/index.html

## Rebuild the SPA

Anytime you change a `template.hbs` file  or modify the `spa` directory, run
`npm run-script build -- --mode=none` from the `spa` directory.

## Previewing an Apple News Feed component (local environment only)

Whenever a component is fetched with the `.anf` extension it will write the output to **apple-news-format/preview/article.json**. You can drag this file over to the Apple News Preview app and it will hot-reload whenever the file is changed.

## Decrypt/Encrypt SOPS files
If you don't have an up to date AWS token run the following first:
```bash
token [INSERT_TOKEN_FROM_MFA_DEVICE]
```

Decrypt an environment file (env param is optional and defaults to the local env):
```bash
make decrypt-env env=development
```
Values can be `development`, `staging`, `production`, `local`. It matches to deploys directory/file naming for the associated env

Encrypt an environment file (local can be changed to development/staging/production):
```bash
make encrypt-local-env
```

## Missed anything?
That _should_ be it...if not, submit an issue or add something to this README.md

## TODO:
- Demo user
- Pretty url (for auth)
