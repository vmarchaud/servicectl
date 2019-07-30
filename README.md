
## Servicectl

Servicectl is a optionated process manager that aim to simplify native init systems for developers.

Currently it only support **linux** distribution with `systemd`, if you really need it to support **windows** or **macos** please open an issue. 

### Getting started

```bash
# Install the CLI first
npm install -g servicectl
# or
yarn global add servicectl

# start your app
sudo servicectl create myapp.js --name myapp
# or with the cluster mode (see under for explaination) 
sudo servicectl create myapp.js --instances 2 --port 8080

# get your logs
servicectl logs myapp --lines 100

# restart your app
sudo servicectl restart myapp

# see the status of your app
servicectl status

# remove the application from your system
sudo servicectl delete myapp
```


## Why Yet Another Process Manager?

I believe most process manager implementations focus on delivering a good experience for developers by re-implementing a daemon and a CLI from scratch (ex: pm2, forever, nodemon, supervisor).

While it help for developers to run their apps, they generally are reinventing the wheel because popular OS already have a process manager builtin: [systemd](https://www.freedesktop.org/wiki/Software/systemd/) for most linux distributions, [launchd](https://www.launchd.info/) for macOS and [Service Control Manager](https://docs.microsoft.com/fr-fr/windows/win32/services/service-control-manager) for Windows.

In theory it should not be a problem but in practive you will often find bugs that doesn't exist in native init systems because they are generally older, well tested and handle a larger scope of use-case.

Anoter argument would be that using the native init system cost less in terms of resources, embed environment like raspberry-pi like system are an example where it could help a lot.

#### Why not use the native init system of my OS then?

You are right, in a perfect world this tool would be *almost* useless because everyone would be leveraging their already-present init systems. However the existence of simpler process manager means (in my opinion at least) that some people find them too difficult to use or configure.

Servicectl aim to help those people, people who aren't system administrator but still need to deploy their applications in production.
However it can also help sysadmin since you can use native CLI (`systemctl` on linux for exemple) after starting the app with `servicectl`.

#### If I use containers I don't see the point of using your tool!

That's because there are no point (*expect some rare cases (ex: coreos)*) of using init systems if you use containers. You should have a scheduler like `kubernetes`, `nomad` or `rancher` (etc.) to manage them. I have no plans to allow to manage them via `servicectl`.

#### What servicectl is not:

- A development process manager: I don't plan to support a `watch` mode for example or any feature that is not used in production.
- A way to manage containers: as said above, you should be using more mature tools to do that.

## Features

### Start an application

To start an application, you need to use `servicectl create` which will register it to your init system:

```bash
# note that you must use sudo on linux
sudo servicectl create app.js
```

The configuration is **immutable** which means that to update it, you will need to delete the app and re-create it.
To see all the flag that you can use, use `servicectl create -h`.
By default the app will be launched in `exec` mode, which means it will only exist one instance of your app. If you want to launch different instances, use the `cluster` mode.

#### Environment variables

The advised way to pass them is to have a `.env` file on your filesystem and to give it as argument with the flag `--env-file <path>`.
You can also use `-e KEY=VALUE` or `--env KEY=VALUE` but again, a env file is generally better.
If you want to import your current shell environment into the application use `--import-env`.

#### Permissions

By default the application will run with the same user as the one you are using to interact with the CLI, but can modify it using `--as=value`:
- `--as=user`: default behavior, use the current user.
- `--as=nobody`: best options, it will create a temporary user/group that got almost no permissions.
- `--as=root`: really really not advised (please only use it if you know what you are doing) run the application as root.

### Get a list of applications running

Different aliases are available (ls, ps, status) will give you this ouput:
```bash
servicectl ps

Name   State  Mode    Uptime     CPU (%) Memory (MB) 
http@1 active cluster 7 sec. ago 0       7.66        
http@0 active cluster 8 sec. ago 0       7.63 
```

You also have different flag to sort, filter and format the list, please refer to `servicectl ps -h`.
The name also contains the number of the instance for a given app (in the format `<name>@<number>`) if you are using the cluster mode.

### Cluster mode

If you used PM2 before, there is a mode called `cluster` which allows to automatically load balance requests to multiple instances of your app. You can do that with `servicectl` too:

```bash
# you need to specify the port that the application listen on
# otherwise it will not work.
servicectl create app.js --instances 2 --port 3000
```

Like PM2, the cluster mode is **supported out of the box using Node.js**. However you can use it anything, please read how to setup socket-enabled systemd service with your language (it's easy as listening on a specific file descriptor):
- Go: https://github.com/coreos/go-systemd/blob/master/examples/activation/httpserver/httpserver.go
- Python: https://github.com/liutec/python-systemd-socket-activated/blob/master/server.py#L13
- Rails: https://www.stderr.nl/Blog/Software/Rails/RailsSocketActivation.html

After changing your code to use the custom file descriptor, just launch your app like above and it should works.

Note that if you are using the cluster mode, you can bind to port under 1000 (without having your app running as root).

### Logs

Log of each service are stored inside `/var/log/servicectl/` for linux, you can retrieve them using:
```bash

# fetch the 15th last lines
servicectl logs <name>

# follow new log
servicectl logs <name> -f

# get n last lines
servicectl logs <name> -n count
```

### Restart 

You can restart one or multiple applications like this:

```bash
servicectl restart <name> | all
```

### Delete 

As said in the *Create* section, you need to delete your application to update its config, to do that you can use:
```bash
# note that you need to use sudo on linux
sudo servicectl delete <name> | all
```

## API

`servicectl` defines a common service definition as well as common init system API ([here](https://github.com/vmarchaud/servicectl/tree/master/src/types)) and implements them for each backend ([here](https://github.com/vmarchaud/servicectl/tree/master/src/backends/)).
You could totally use it as an API, I would advise to check how the CLI commands are interacting with it [here](https://github.com/vmarchaud/servicectl/tree/master/src/cli/)

Note that the initial version of `servicectl` only includes support for `systemd`, if you need to use it on another init system please open an issue if your use-case.

## Versioning

This library follows [Semantic Versioning](http://semver.org/).

Before the 1.0.0 release, any minor update can have breaking changes.

## LICENSE

Apache License 2.0
