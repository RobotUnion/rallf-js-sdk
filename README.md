# RobotUnion Node.js SDK (experimental)


Toolset to create Robot Apps for [R.A.L.F.](https://ralf.robotunion.net)
based on [Client for webdriver/selenium 2.](https://github.com/admc/wd)


<<<<<<< HEAD
# First steps
## Installation
=======
## First steps
### Installation
>>>>>>> 3415fc997d35abd09ffc5e5245f1cb804c6cc36d
* Create a new node project `npm init`
* Add `RobotUnion/robot-js-sdk` as a dependecy to your `package.json`

  ```json
  {
    "name": "robot-dev-example",
    "version": "1.0.0",
    "dependencies": {
      "robot-js-sdk": "git://github.com/RobotUnion/robot-js-sdk.git"
    }
  }
  ```
* Run `npm install` to install the sdk

### Create simple Robot Task
  * Create the RobotApp manifest `manifest.json` within the `config` folder

    ```json
    {
      "name": "robot-dev-example",
      "type": "web",
      "main": "src/main.js",
      "debug_url": "",
      "version_name": "1.0.0",
      "code_version": 0,
      "key": "access_key",
      "secret": "access_secret"
    }
    ```
      * You can get the access key and secret from [RALF Panel](https://ralf-staging.robotunion.net/)
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
      constructor(){
        super();
      }
      run(){
        let device = this.device;
        let logger = this.logger;

        logger.debug("Started");

        device.init({browserName: 'chrome'},
          function() {
            logger.debug("Initted");
            device.get("https://github.com", _ => {
              device.title(function(err, title) {
                logger.debug(title);
              })
            })
          })
      }
    }
    module.exports = MyFirstTask;
    ```
    * First you need to require `Task` from `Execution/Task`
    * Now create a class to extend `Task` from
    * Finally create a `run` function, this funtion is going to run when the RobotApp runs
    * Check wd api [here](https://github.com/admc/wd/blob/master/doc/api.md) for more documentation

### Run debug
```sh
$ rr
```
### Package app
```sh
$ rpkg
```


# API
## Task
* Properties
  * ``
