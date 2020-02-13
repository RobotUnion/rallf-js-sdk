# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 1.0.0-beta.3
* fix: isTTY does not affect formatting now
* fix: fixed rpiecy sendAndAwait is deprecated now using waitFor and output
* fix: removed warning if no input is passed just default to {}
* feat: added preNotify to logger when RPC output is enabled, to convert messages into RPC notifications
* feat: made std notifier until implemented in LogginJS itself, to be able to output error through stderr
* fix: removed a log, made it debug instead


## v0.7.8
* Fixed `rallf-js package` not outputing 


## v0.7.5
* Runner on close performs cooldown also


## v0.7.1
* Removed autocooldown, and updated events to match standard

## v0.7.0
* Changed rpc comunication standard to match https://github.com/QbitArtifacts/rallf-doc/blob/master/tech/developers/sdk/specification.md


## v0.6.0
* Fixed commands not working on MacOSx
* Fixed Devices.get() threw error if device.name not defined
* Added gitignore to init command


## v0.5.0
* Added `please-update` module, for checking if sdk is in the latest version
* Secured git hooks with `husky`
* Added ESLint
* Updated examples
* Added shortcuts to logger (@='task.fqtn', $='task.name'm %='task.robot_id')

## v0.4.12
* Refactored events.PubSub, now it extends from Node.EventEmitter

