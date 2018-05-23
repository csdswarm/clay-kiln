# Clay Starter

A repo that contains a basic site and the necessary files to provision AWS resources for hosting the site.

## To Start

Edit your `/etc/hosts` file to include the following:

```
127.0.0.1 localhost.demo.com

```

## Local Development

You'll probably want to windows in your terminal open for now.

### Terminal Window 1

```bash
$ cd app
```

NPM install

```bash
$ npm i
```

Run Gulp

```bash
$ gulp
```

This is to make sure your `public` directory exists. Without it the site won't run.

Add in a `local.yml` file to `app/sites/demo/` with the following:

```yaml
host: localhost.demo.com
```

This is the window where you'll re-run Gulp as you need to. Right now only the tasks for building model.js, template files and CSS.

### Termindal Window 2

Navigate to the root of the project, where the `Makefile` exists.

This is where the app will actually be run from. Make sure you're not runnning `sites` Clay instance.

```bash
$ make up
```

This is going to spin up a Redis, ElasticSearch and Clay instance. The Clay image will be built using the `Dockerfile` in the `app/` directory. The directories for `components`, `sites`, `services` and `public` are mounted into the container, which is why you'll run Gulp from your host machine.

The container should be running `nodemon`, so changes to files will be detected. You MAY have to restart your container when adding a new component, but maybe not. If that's the case, submit an issue.

#### When do I need to restart?

If you `npm install` a new package, you'll need to build a new image. This has been captured in a Makefile command

```bash
$ make up-clay
```
You can run this without stopping anything and it'll swap in a new container with the new image to all the services, but you'll need to get the logs back again by running the log command.

### If I want to stop dev?

```bash
$ make down
```

### Clearing out local data?

```bash
$ make clear-data
```


## Missed anything?
That _should_ be it...if not, submit an issue or add something to this README.




## TODO:
- Demo user
- Pretty url (for auth)
