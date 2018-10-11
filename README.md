# RALLF Node.js SDK (#unstable)

[![GitHub](https://img.shields.io/github/license/RobotUnion/rallf-js-sdk.svg?style=flat-square)](https://github.com/RobotUnion/rallf-js-sdk)
[![npm](https://img.shields.io/npm/v/rallf-sdk.svg?style=flat-square)](https://www.npmjs.com/package/rallf-sdk)
[![David](https://img.shields.io/david/RobotUnion/rallf-sdk.svg?style=flat-square)](https://github.com/RobotUnion/rallf-js-sdk)
[![node](https://img.shields.io/node/v/rallf-sdk.svg?style=flat-square)](https://www.npmjs.com/package/rallf-sdk)



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

### Create simple Robot Task
  1. Create a empty folder
  2. Initialize with `npm init rallf-task-js robot-dev-example`
  3. Edit the manifest [`config/manifest.json`](https://github.com/RobotUnion/rallf-js-sdk/wiki/Manifest) to fit your needs:

    ```js
    {
      "name": "robot-dev-example",
      "main": "src/main.js",
      "version": "1.0.0",
      "language": "nodejs",
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
        }
      }
    }
    ```
      * `name`: this is the name of your task over at [alpha.rallf.com](https://alpha.rallf.com)
      * `main`: the main file of the Task `src/main.js`
      * `version`: version of your task
      * `language`: this is just to tell the incubator what language the task is
      * `devices`: list of devices this Task is going to use
      * `permissions`: list of permissions the task requests

  4. Now you can also modify the main file of your task `src/main.js`:
  
```js
  /* File: 'src/main.js' */
  const rallf              = require('rallf-js-sdk');
  const { By, Key, until } = require('selenium-webdriver');

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
      this.firefox = await this.device.get('firefox');

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
  Okey let me explain the above:
  1. First of all we import the `rallf-js-sdk` and the necesary `selenium-webdriver` imports.

### Run Locally
This will **run** the task as and log locally.
```
$ node ./node_modules/rallf-sdk/bin/rallf-js-runner.js .
```
Usage: rallf-js-runner.js **<task_path>** **<json_robot>** **<json_input>**

