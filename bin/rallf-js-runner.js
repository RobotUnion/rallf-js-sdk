#!/usr/bin/env node --no-warnings



const argv = require('yargs').argv;

const path = require('path');

const fs = require('fs');

const wdClient = require('wd');

const IdeLogger = require('../src/Integration/IdeLogger');

const { Builder, By, until } = require('selenium-webdriver');

const firefox = require('selenium-webdriver/firefox');

const chrome = require('selenium-webdriver/chrome');



// console.log("Args", argv);



const task_path = argv.task_path || '.';

const robot = argv.robot || '{}';

const input = argv.input || '{}';

const manifest_path = path.resolve(task_path) + '/config/manifest.json';

const manifest = JSON.parse(fs.readFileSync(manifest_path).toString());

const mainFile = manifest.main;

const capabilities = manifest.capabilities;

const type = manifest.type;

const isLocal = argv.local;



console.log('Is local: ' + isLocal);



let taskLogger;

taskLogger = new IdeLogger(process);

taskLogger.info('Setting up');





const runner = {

    driver: null,

    task: null,

    persisting: false,



    /* call task lifecycle hook securely */

    callLifecycleHook(name, ...args) {

        let lch = this.task[name];

        if (this.task && typeof lch === 'function') {

            return lch.bind(this.task)(...args);

        }

    },



    finish(status_code = 0) {

        if (!this.persisting) {

            if (this.driver) {

                this.driver.quit().then(

                    () => {

                        process.stdout.write('finished: with asd code ' + status_code);

                        return process.exit(status_code);

                    }

                );

            }

            else {

                process.stdout.write('finished: with code ' + status_code);

                return process.exit(status_code);

            }

        }

    },

    isWeb(task) {

        return task.type.includes('web');

    },

    isAndroid(task) {

        return task.type.includes('android');

    },

    isStandalone(task) {

        return task.type.includes('standalone');

    },

    getRobot() {

        taskLogger.debug('robot: ' + robot);



        return {

            self: {},

            kb: {},

            ...JSON.parse(robot)

        };

    },

    getInput() {



    },



    safeJSONParse(str) {

        let parsed;

        try {

            parsed = JSON.parse(str);

        } catch (e) {

            parsed = JSON.parse(JSON.stringify(str));

        }

        return parsed;

    },

    parseEvent(evtString) {

        let [x, name, data] = evtString.match(/^event:(\w*) (.*)/);



        return {

            data: this.safeJSONParse(data),

            name: name

        }

    },

    run() {

        // this.task.onBeforeStart();

        this.callLifecycleHook('onBeforeStart');

        this.task.device = this.driver;

        this.task.robot = runner.getRobot();

        this.task.input = runner.getInput();

        let self = this;

        let pipePath = path.resolve(task_path) + '/event-pipe';



        fs.watchFile(pipePath, (curr, prev) => {

            taskLogger.debug('File changed: ' + curr);

            let data = fs.readFileSync(pipePath).toString();

            if (data.includes('event:')) {

                let parsed = this.parseEvent(data);

                this.callLifecycleHook('onEvent', parsed);

            }

        });



        this.task.persist = () => {

            this.persisting = true;

            return new Promise((resolve, reject) => {

                let robot = this.task.robot;

                try {

                    process.stdout.write('ROBOT:SAVE ' + JSON.stringify(robot));

                    process.stdin.once('data', (data) => {



                        // taskLogger.debug('in stdin on data event');

                        if (data.includes('persist-finished')) {

                            // Here should call other lifecycle hook, persistFinished?

                            // this.callLifecycleHook('persistFinished');

                            this.persisting = false;

                            resolve();

                        }

                    });

                } catch (error) {

                    process.stderr.write('error: ' + error);

                    this.persisting = false;

                    reject();

                }

            });

        };



        this.task.infinite = () => {

            return new Promise((resolve, reject) => { });

        };



        this.task.quit = () => {

            this.callLifecycleHook('onFinish');

            this.finish(0);

        };



        let prom = this.task.run();



        if (prom && prom.then) {

            prom.then(resp => {

                // process.stdout.write('On run promise: ' + resp + '\n');

                setTimeout(() => {

                    // this.task.onFinish();

                    this.callLifecycleHook('onFinish');

                    this.finish(0);

                }, 100);

            }).catch(e => {

                this.persisting = false;

                process.stderr.write('error: ' + new Error(e));

                this.finish(1);

            });

        }

    }

};



// resolve task path

const taskPath = path.resolve(task_path + '/' + mainFile);



// Remove from cache

delete require.cache[taskPath];



// Import task

const Task = require(taskPath);



const tmpRequire = require;

require = (pckg_name) => {

    // Only allow some packages to be required

    if (pckg_name === '../Integration') return tmpRequire(pckg_name);

}



// Create task instance

let task = new Task();



task.logger = taskLogger;

task.name = manifest.name;

task.type = manifest.type;

task.version = manifest.version;



runner.task = task;



// If its not standalone we need to launch webdriver

if (!runner.isStandalone(task)) {

    const screen = {

        width: 640,

        height: 480

    };



    let builder = new Builder().forBrowser(capabilities.browserName);



    if (!isLocal || capabilities.browserName === 'firefox' && capabilities.headless) {

        builder.setFirefoxOptions(new firefox.Options().headless().windowSize(screen));

    }

    else if (!isLocal || capabilities.browserName === 'chrome' && capabilities.headless) {

        builder.setFirefoxOptions(new chrome.Options().headless().windowSize(screen));

    }



    builder.build()

        .then(driver => {

            runner.driver = driver;

            runner.run();

        })

        .catch(e => {

            if (e) {

                runner.driver.quit();

                process.stderr.write('error: ' + e);

                return process.exit(1);

            }

        });

} else {

    runner.run();

}



