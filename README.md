# RALLF Node.js SDK (#unstable)

[![GitHub](https://img.shields.io/github/license/RobotUnion/rallf-js-sdk.svg)](https://github.com/RobotUnion/rallf-js-sdk)



Toolset to create Robot Apps for [RALLF](https://ralf.robotunion.net)
based on [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver)

## Index
* [Getting Started](https://github.com/RobotUnion/rallf-sdk/wiki/Getting-Started)
* [Creating Tasks](https://github.com/RobotUnion/rallf-sdk/wiki/Creating-Tasks)
* [Running Tasks](https://github.com/RobotUnion/rallf-sdk/wiki/Running-Tasks)
* [Technical Docs](https://github.com/RobotUnion/rallf-sdk/wiki/Technical-Docs)


## First steps
### Installation
* Run `npm install rallf-sdk --save` to install the sdk

### Create simple Robot Task
  * Create the [Task](https://github.com/RobotUnion/rallf-sdk/wiki/Task) manifest `manifest.json` within the `config` folder

    ```json
    {
      "name": "robot-dev-example",
      "type": "web",
      "main": "src/main.js",
      "version_name": "1.0.0",
      "key": "access_key",
      "secret": "access_secret",
      "language": "nodejs|python",
      "capabilities": {
        "browserName": "firefox|chrome",
        "headless": false
      }
    }
    ```
      * The **name** of your task will be the one in `manifest.json`
      * ~~You can get the access key and secret from [RALLF Panel](https://alpha.rallf.com/)~~
      * `main`: should be the main file of the Task `src/main.js`


  * Create a `src` folder within your app folder
  * Now create the main file for your app `main.js` inside `src`

  * Task Example
    ```js
    /*
      File: 'src/main.js'
    */
    const Task = require('rallf-sdk');

    class MyFirstTask extends Task {
      constructor() {
        super();
      }

      error(err) {
        this.logger.error('There has been an error ' + err);
        this.finish(1);
      }

      onFinish() {
        this.logger.debug("On finish");
      }

      onBeforeStart() {
        this.logger.debug("Before start");
      }

      run() {
        let device = this.device;
        let logger = this.logger;
        let robot = this.robot;
        let input = this.input;

        logger.debug("Task Asdfsd started with robot: " + robot.self.alias);

        // Must return a promise
        return device.get('https://github.com/')
          .then(_ => device.getTitle())
          .then(_ => logger.debug('title: ' + _));
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

