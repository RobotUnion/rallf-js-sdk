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
  * Edit the manifest [`manifest.json`](https://github.com/RobotUnion/rallf-js-sdk/wiki/Manifest) within the `config` folder to fit your needs:

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
      * `main`: should be the main file of the Task `src/main.js`

  * Now you can also modify the main file of your task `main.js` inside `src`
  * Task Example
    ```js
    /*
      File: 'src/main.js'
    */
    const { Task }           = require('rallf-js-sdk');
    const { By, Key, until } = require('selenium-webdriver');

    class RobotDevExample extends Task {
      constructor() {
        super();
        this.firefox = null;
      }

      /**
       * 
       */
      async run() {
       
        // Initialize firefox and return instance of WebDriver
        this.firefox = await this.device.get('firefox');

        // You can log stuff via the available logger
        this.logger.debug(`Task RobotDevExample started with robot: ${robot.kb.id}`);
        
        // Lets load github.com
        await this.firefox.get('https://github.com');
        
        // Lets get the title
        let title = await this.firefox.getTitle();
        
        return title;
      }
    }
    module.exports = MyFirstTask;
    ```
    * First you need to require `Task` from [`Execution/Task`](https://github.com/RobotUnion/rallf-sdk/wiki/Integration---Task)
    * Now create a class to extend `Task` from
    * Finally create a `run` function, this funtion is going to run when the Task is executed.
    * Check the docs here: [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver)

### Run Locally
This will **run** the task as and log locally.
```
$ node ./node_modules/rallf-sdk/bin/rallf-js-runner.js .
```
Usage: rallf-js-runner.js **<task_path>** **<json_robot>** **<json_input>**

