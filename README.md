# RALLF Node.js SDK

<!-- Docs links -->
[manifest-docs]: https://github.com/RobotUnion/rallf-js-sdk/wiki/Manifest
[cli-docs]: https://github.com/RobotUnion/rallf-js-sdk/wiki/CLI---runner
[task-docs]: https://github.com/RobotUnion/rallf-js-sdk/wiki/Integration---Task
[skill-docs]: https://github.com/RobotUnion/rallf-js-sdk/wiki/Integration---Skill



[license-img]: https://img.shields.io/github/license/RobotUnion/rallf-js-sdk.svg?style=flat-square
[github-link]: https://github.com/RobotUnion/rallf-js-sdk

[rallf-status-img]: https://img.shields.io/website-up-down-green-red/https/api.rallf.com.svg?label=site&style=flat-square
[rallf-link]: https://rallf.com

[npm-version-img]: https://img.shields.io/npm/v/rallf-js-sdk.svg?style=flat-square
[npm-link]: https://www.npmjs.com/package/rallf-js-sdk

[gh-pkg-version-img]: https://img.shields.io/github/package-json/v/RobotUnion/rallf-js-sdk.svg?style=flat-square
[npm-deps-img]: https://img.shields.io/david/RobotUnion/rallf-js-sdk.svg?style=flat-square

[wiki-img]: https://img.shields.io/badge/wiki-github-green.svg?longCache=true&style=flat-square
[wiki-link]: https://github.com/RobotUnion/rallf-js-sdk/wiki

[![License][license-img]][github-link]
[![Website][rallf-status-img]][rallf-link]
[![npm][npm-version-img]][npm-link]
[![GitHub package version][gh-pkg-version-img]][github-link]
[![Dependencies][npm-deps-img]][github-link]
[![wiki][wiki-img]][wiki-link]

Toolset to create, test & deploy **Tasks** for [RALLF][rallf-link] _(**NodeJS** Edition)_

### Quick Links
Docs: [CLI][cli-docs], [Task][task-docs], [Skill][skill-docs], [Manifest][manifest-docs]

## Resources
* [First steps](#first-steps)
  * [Create simple Task](#create-simple-task)
  * [Create simple Skill](#create-simple-skill)
* [Getting Started](https://github.com/RobotUnion/rallf-sdk/wiki/Getting-Started)
* [Examples](examples)
* [Creating Tasks](https://github.com/RobotUnion/rallf-sdk/wiki/Creating-Tasks)
* [Running Tasks](https://github.com/RobotUnion/rallf-sdk/wiki/Running-Tasks)
* [Technical Docs](https://github.com/RobotUnion/rallf-sdk/wiki/Technical-Docs)
* [OpenCV](https://github.com/RobotUnion/rallf-sdk/wiki/Integration---OpenCV)

## First steps

### Dependencies
You will need to have [NodeJS](https://nodejs.org/es/) and [npm](https://www.npmjs.com/get-npm) installed.
> !! It is necesary to have Firefox installed as well as [geckodriver](https://github.com/mozilla/geckodriver/releases), so example is successfull !!

### Installation
* Run `npm install rallf-js-sdk -g` to install the sdk and have access to global [commands]()

### Create simple Task
  1. Create an empty folder: `mkdir test-task && cd test-task`
  2. Init a task project with: `rallf-init`  
     2.1. Init will ask some questions
  3. **init** will generate the following some files (_explained below_)
  * `config/manifest.json` - The [Manifest][manifest-docs] holds information about your Task, e.g: name, version, fqtn
  * `mocks/test.task.com/index.js` - [Mocks](https://github.com/RobotUnion/rallf-js-sdk/wiki/Testing:-Mocks) are just the way of testing your tasks locally, without a [Incubator]()
  * `robots/test-robot/` - [Robots]() TODO...
  * `src/main.js` - This is the main file of the task, the one that will get executed

### Create simple Skill
1. Follow the steps above until 2.
2. In step 2 pass `--skill` option, this will generate a skill template for you
3. It will create the same structure as above.

## Running 
### Running a task
  * `npm start`
  * `rallf-runner run -r test-robot --input {}`    
    
### Running a Skill
  * `npm run run:getTitle`
  * `rallf-runner run -r test-robot --method getTitle --input '{}'`    
      * If method is passed it will asume it is a skill and will run that method


You will know if everything went OK  .

Now you can have fun! 🤖

## Found a bug?
If you found a bug please leave us an issue.
* Make sure you check the [contributing guidelines](https://github.com/RobotUnion/rallf-js-sdk/blob/v2/.github/CONTRIBUTING.md) before.
* Make sure that issue has not been reported

<!-- {"jsonrpc": "2.0", "method": "run-method", "params": { "method": "followUser", "username":"santoslluis" }, "id": "test"} -->
