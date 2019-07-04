
## Servicectl

Servicectl is a optionated process manager that aim to simplify native init systems for developers.

#### Why ?

I believe most process manager implementations focus on delivering a good experience for developers by re-implementing a daemon and a cli for scratch. 

While it help for developers to run their apps, they are just reinventing the wheel because all OS already have a process manage builtin: [systemd](https://www.freedesktop.org/wiki/Software/systemd/) for most linux distributions, [launchd](https://www.launchd.info/) for macOS and [Service Control Manager](https://docs.microsoft.com/fr-fr/windows/win32/services/service-control-manager) for Windows. 

The goal of `servicectl` is to provide a consistent and simple API for every platforms while allowing to use every feature of the underlying init system. 

#### How ?

`servicectl` defines a common service definition as well as common init system API ([here](https://github.com/vmarchaud/servicectl/tree/master/src/types)) and implements them for each backend ([here](https://github.com/vmarchaud/servicectl/tree/master/src/models/)).
Note that the initial version of `servicectl` only includes support for `systemd`

## Versioning

This library follows [Semantic Versioning](http://semver.org/).

Note that before the 1.0.0 release, any minor update can have breaking changes.

## LICENSE

Apache License 2.0
