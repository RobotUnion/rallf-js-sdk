# RALLF Node.js SDK

[![GitHub](https://img.shields.io/github/license/RobotUnion/rallf-js-sdk.svg?style=flat-square)](https://github.com/RobotUnion/rallf-js-sdk)
[![npm](https://img.shields.io/npm/v/rallf-sdk.svg?style=flat-square)](https://www.npmjs.com/package/rallf-sdk)
[![David](https://img.shields.io/david/RobotUnion/rallf-sdk.svg?style=flat-square)](https://github.com/RobotUnion/rallf-js-sdk)
[![node](https://img.shields.io/node/v/rallf-sdk.svg?style=flat-square)](https://www.npmjs.com/package/rallf-sdk)


<<<<<<< HEAD

=======
>>>>>>> v2
Toolset to create/test **Tasks** for [RALLF](https://ralf.robotunion.net)
based on [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver)

## Resources
* [First steps](#first-steps)
* [Getting Started](https://github.com/RobotUnion/rallf-sdk/wiki/Getting-Started)
* [Creating Tasks](https://github.com/RobotUnion/rallf-sdk/wiki/Creating-Tasks)
* [Running Tasks](https://github.com/RobotUnion/rallf-sdk/wiki/Running-Tasks)
* [Technical Docs](https://github.com/RobotUnion/rallf-sdk/wiki/Technical-Docs)


## First steps
### Installation
* Run `npm install rallf-js-sdk --save` to install the sdk

<<<<<<< HEAD
### Create simple Robot Task
  1. Create an empty folder
  2. Create the manifest [`config/manifest.json`](https://github.com/RobotUnion/rallf-js-sdk/wiki/Manifest) to fit your needs:
=======
### Create simple Task
  1. Create an empty folder: `mkdir test-task && cd test-task`
  2. Init with npm: `npm init`
  3. Install the sdk: `npm install rallf-js-sdk -s`
  4. Create the manifest [`config/manifest.json`](https://github.com/RobotUnion/rallf-js-sdk/wiki/Manifest) to fit your needs:
>>>>>>> v2

```js
{
  "name": "robot-dev-example",
  "main": "src/main.js",
  "version": "1.0.0",
  "language": "nodejs",
<<<<<<< HEAD
  "devices": [
    {
      "name": "firefox",   // Check available devices here: <INSERT_LINK>
      "headless": true,    // Only for development
      "profile": "@robot", // Select a profile to be set when launching firefox
    }
  ],
  "permissions": {
    "browser": {
      "firefox:profile": ["read"] // To use the profile above you must also ask for read permission
=======
  "skills": {
    "Facebook": {
      "like"
>>>>>>> v2
    }
  }
}
```
  * `name`: this is the name of your task over at [alpha.rallf.com](https://alpha.rallf.com)
  * `main`: the main file of the Task `src/main.js`
  * `version`: version of your task
  * `language`: this is just to tell the incubator what language the task is
<<<<<<< HEAD
  * `devices`: list of devices this Task is going to use
  * `permissions`: list of permissions the task requests

  3. Now you can also create the main file of your task `src/main.js`:
=======
  * `skills`: list of skills this Task is going to use

  5. Now you can also create the main file of your task `src/main.js`:
>>>>>>> v2
  
```js
  /* File: 'src/main.js' */
  const rallf = require('rallf-js-sdk');

  class RobotDevExample extends rallf.Task {
    constructor() {
      super();
      this.firefox = null;
    }

    /**
     * This function will run once everything is properly loaded and set to go
     */
    async run() {

      // Initialize firefox and return instance of WebDriver
<<<<<<< HEAD
      this.firefox = await this.device.get('firefox');
=======
      this.firefox = await this.devices.get('firefox');
>>>>>>> v2

      // You can log stuff via the available logger
      this.logger.debug(`Task RobotDevExample started with robot: ${robot.kb.id}`);

      // Let's load github.com
      await this.firefox.get('https://github.com');

      // Let's get the title
      let title = await this.firefox.getTitle();

      return title;
    }
  }
  module.exports = MyFirstTask;
``` 
<<<<<<< HEAD
  Okey let me explain the above:
  1. First of all we import the `rallf-js-sdk`.
  2. We create a class that extends from **rallf.Task**.
  3. We define an async method `run` wich is the main method of the **Task**, this means that, if the task is not a [lib]() it will be the "entrypoint or Main" of the task.
  4. Inside run we first get access to firefox, via `this.device.get` method, wich will return an instance of [WebDriver](), if the task has requested access to that device, it will be available when it requests it.
  5. There is a logger available to you via [`this.logger`]()
  6. After that we tell firefox to load github.com
  7. Once firefox has loaded the page we then ask for the title of the page and return it.

### Run Locally
This will **run** the task in [development mode]() and log locally.
```
$ node ./node_modules/rallf-sdk/bin/rallf-js-runner.js --robot=test-robot
```
Usage: `rallf-js-runner.js --robot=<(new|<str>)> [--task_path=<string>] [--robot_name=<string>]`

## Found a Bug?
If you have found a bug please leave us a issue.

## Collaborating
...


=======
  Okey let me explain the above:  
  1. First of all we import the `rallf-js-sdk`.  
  2. We create a class that extends from **rallf.Task**.  
  3. We define an async method `run` wich is the main method of the **Task**, this means that, if the task is not a [lib]() it will be the "entrypoint or Main" of the task.  
  4. Inside run we first get access to firefox, via `this.device.get` method, wich will return an instance of [WebDriver](), if the task has requested access to that device, it will be available when it requests it.  
  5. There is a logger available to you via [`this.logger`]()  
  6. After that we tell firefox to load github.com   
  7. Once firefox has loaded the page we then ask for the title of the page and return it.  

## Optional
* Optionaly you can create a mock file (_if your task delegates or uses some skill_):
  * `mocks/test.mock.js` [Example](./examples/basic-example/mocks/test.mock.js)
* Create a robot if needed:
  * `robots/robot-test` [Example](./examples/basic-example/robots/robot-test)

## Running 
`node ./node_modules/.bin/rallf-runner --mock test --input {}`  
You will now if everything went OK

Now you can have fun! 🤖

## Found a bug?
If you found a bug please leave us an issue.
* Make sure you check the [contributing guidelines](https://github.com/RobotUnion/rallf-js-sdk/blob/v2/.github/CONTRIBUTING.md) before.
* Make sure that issue has not been reported
>>>>>>> v2

