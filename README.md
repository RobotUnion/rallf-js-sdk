# RALLF Node.js SDK

[![Build Status](https://semaphoreci.com/api/v1/nombrekeff/loggin-js/branches/master/badge.svg)](https://semaphoreci.com/nombrekeff/loggin-js)
<!-- ![Codacy grade](https://img.shields.io/codacy/grade/28253ebf50a34a088b99d3f3e80615bc.svg?style=flat-square)-->


[![Website](https://img.shields.io/website-up-down-green-red/https/api.rallf.com.svg?label=api&style=flat-square)](https://rallf.com)
[![GitHub](https://img.shields.io/github/license/RobotUnion/rallf-js-sdk.svg?style=flat-square)](https://github.com/RobotUnion/rallf-js-sdk)
[![npm](https://img.shields.io/npm/v/rallf-js-sdk.svg?style=flat-square)](https://www.npmjs.com/package/rallf-js-sdk)
[![David](https://img.shields.io/david/RobotUnion/rallf-js-sdk.svg?style=flat-square)](https://github.com/RobotUnion/rallf-js-sdk)
[![wiki](https://img.shields.io/badge/wiki-github-green.svg?longCache=true&style=flat-square
)](https://github.com/RobotUnion/rallf-js-sdk/wiki)

Toolset to create/test **Tasks** for [RALLF](https://ralf.robotunion.net)
based on [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver)

## Resources
* [First steps](#first-steps)
  * [Create simple Task](#create-simple-task)
  * [Create simple Skill](#create-simple-skill)
* [Getting Started](https://github.com/RobotUnion/rallf-sdk/wiki/Getting-Started)
* [Creating Tasks](https://github.com/RobotUnion/rallf-sdk/wiki/Creating-Tasks)
* [Running Tasks](https://github.com/RobotUnion/rallf-sdk/wiki/Running-Tasks)
* [Technical Docs](https://github.com/RobotUnion/rallf-sdk/wiki/Technical-Docs)


## First steps

### Dependencies
You will need to have [NodeJS](https://nodejs.org/es/) and [npm](https://www.npmjs.com/get-npm) installed.
> Recomended to have Firefox installed as well as [geckodriver](https://github.com/mozilla/geckodriver/releases)

### Installation
* Run `npm install rallf-js-sdk -g` to install the sdk and have access to global [commands]()

### Create simple Task
  1. Create an empty folder: `mkdir test-task && cd test-task`
  2. Init a task project with: `rallf-init`  
     2.1. Init will ask some questions
  3. **init** will generate the following file structure (_explained below_)
  ```
  |-- config
    `-- manifest.json
  |-- mocks
    `-- test.mock.js
  |-- robots
    `-- test-robot
        `-- data.json
  |-- src
    `-- main.js
  |-- package.json
  \-- README.md
  ```
  * `config/manifest.json` - The [Manifest](https://github.com/RobotUnion/rallf-js-sdk/wiki/Manifest) holds information about your Task, e.g: name, version, fqtn
  * `mocks/test.mock.js` - [Mocks](https://github.com/RobotUnion/rallf-js-sdk/wiki/Testing:-Mocks) are just the way of testing your tasks locally, without a [Incubator]()
  * `robots/test-robot` - [Robots]() TODO...
  * `src/main.js` - This is the main file of the task, the one that will get executed


### Create simple Skill
1. Follow the steps above until 2.
2. In step 2 pass `--skill` option, this will generate a skill template for you
3. It will create the same structure as above.

## Running 
### Running a task
  * `npm start`
  * `rallf-runner run --mock test --input {}`    
    
### Running a Skill
  * `npm run run:getTitle`
  * `rallf-runner run --mock test --input {} --method getTitle`    
      * If method is passed it will asume it is a skill and will run that method


You will now if everything went OK  
Now you can have fun! 🤖

## Found a bug?
If you found a bug please leave us an issue.
* Make sure you check the [contributing guidelines](https://github.com/RobotUnion/rallf-js-sdk/blob/v2/.github/CONTRIBUTING.md) before.
* Make sure that issue has not been reported

