# RobotUnion Node.js SDK (experimental)
### ! NOT YET USABLE

Toolset to create Robot Apps for [RALLF](https://ralf.robotunion.net)
based on [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver)


## First steps
### Installation
* Create a new node project `npm init`
* Run `npm install rallf-sdk` to install the sdk
* Run `npm install rallf-sdk -g` to install the sdk

### Create simple Robot Task
  * ~~Use the included generator: `rallf-sdk init`~~
    * ~~This will guide you through the process of creating a rallf task.~~
  * Create the RobotApp manifest `manifest.json` within the `config` folder

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
      * You can get the access key and secret from [RALLF Panel](https://alpha.rallf.com/)
      * `main`: should be the main file of the RobotApp `src/main.js`


  * Create a `src` folder within your app folder
  * Now create the main file for your app `main.js` inside `src`

  * RobotApp Example
    ```js
    /*
      File: 'src/main.js'
    */
    const Task = require('../Execution/Task');

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
    * First you need to require `Task` from `Execution/Task`
    * Now create a class to extend `Task` from
    * Finally create a `run` function, this funtion is going to run when the **RobotApp** runs
    * Check the docs here: [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver)

### Run Locally
This will **run** the task as and log locally.
```
$ node ./node_modules/rallf-sdk/bin/rallf-js-runner.js .
```
Usage: rallf-js-runner.js **<task_path>** **<json_robot>** **<json_input>**

