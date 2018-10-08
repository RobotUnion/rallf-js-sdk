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
taskLogger = new IdeLogger(process, argv.pretty);
taskLogger.info('Setting up');



const runner = {
    driver: {
        async init() {
            if (!runner.isStandalone(task)) {
                const screen = {
                    width: 640,
                    height: 480
                };

                let builder = new Builder().forBrowser(capabilities.browserName);

                if (!isLocal || (capabilities.browserName === 'firefox' && capabilities.headless)) {
                    builder.setFirefoxOptions(new firefox.Options().headless().windowSize(screen));
                }
                else if (!isLocal || (capabilities.browserName === 'chrome' && capabilities.headless)) {
                    builder.setFirefoxOptions(new chrome.Options().headless().windowSize(screen));
                }

                return builder.build()
                    .then(driver => {
                        runner.task.device = driver;
                    })
                    .catch(e => {
                        if (e) {
                            process.stderr.write('error: ' + e + '\n');
                            return process.exit(1);
                        }
                    });
            }
        }
    },
    task: null,
    persisting: false,

    /* call task lifecycle hook securely */
    callLifecycleHook(name, ...args) {
        let lch = this.task[name];
        if (this.task && typeof lch === 'function') {
            return lch.bind(this.task)(...args);
        }
    },

    finish(msg) {
        if (!this.persisting) {
            let pipePath = path.resolve(task_path) + '/event-pipe';
            if (fs.existsSync(pipePath)) {
                fs.unlinkSync(pipePath);
            }
            if (this.driver.quit) {
                this.driver.quit().then(
                    () => {
                        process.stdout.write('finished: ' + msg + '\n');
                        return process.exit(msg);
                    }
                );
            }
            else {
                process.stdout.write('finished: ' + msg + '\n');
                return process.exit(msg);
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
        return JSON.parse(input) || {};
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


        // Create pipe if not created
        if (!fs.existsSync(pipePath)) {
            fs.writeFileSync(pipePath, '');
        }

        // Used for inwards events
        fs.watchFile(pipePath, (curr, prev) => {
            if (fs.existsSync(pipePath)) {
                let data = fs.readFileSync(pipePath).toString();
                if (data.includes('event:')) {
                    this.callLifecycleHook('onEvent', this.parseEvent(data));
                }
            }
        });


        this.task.persist = () => {
            this.persisting = true;
            return new Promise((resolve, reject) => {
                let robot = this.task.robot;
                try {
                    // Send ROBOT:SAVE event
                    process.stdout.write('ROBOT:SAVE ' + JSON.stringify(robot));

                    // Set an event listener for 'data' 
                    // If it contains 'persist-finished' we can resolve the promise
                    process.stdin.on('data', (data) => {
                        if (data.includes('persist-finished')) {
                            fs.unwatchFile(pipePath);
                            this.persisting = false;
                            resolve();
                        }
                    });
                } catch (error) {
                    process.stderr.write('error: ' + error + '\n');
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

        // Promise will run hen task finishes or fails
        if (prom && prom.then) {
            prom.then(resp => {
                setTimeout(() => {
                    this.callLifecycleHook('onFinish');
                    this.finish(resp);
                }, 100);
            }).catch(err => {
                this.persisting = false;
                process.stderr.write('error: ' + err.stack);
                this.finish(err);
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

runner.run();

// If its not standalone we need to launch webdriver
// if (!runner.isStandalone(task)) {
//     const screen = {
//         width: 640,
//         height: 480
//     };

//     let builder = new Builder().forBrowser(capabilities.browserName);

//     if (!isLocal || (capabilities.browserName === 'firefox' && capabilities.headless)) {
//         builder.setFirefoxOptions(new firefox.Options().headless().windowSize(screen));
//     }
//     else if (!isLocal || (capabilities.browserName === 'chrome' && capabilities.headless)) {
//         builder.setFirefoxOptions(new chrome.Options().headless().windowSize(screen));
//     }

//     builder.build()
//         .then(driver => {
//             runner.driver = driver;
//             runner.run();
//         })
//         .catch(e => {
//             if (e) {
//                 runner.driver.quit();
//                 process.stderr.write('error: ' + e + '\n');
//                 return process.exit(1);
//             }
//         });
// } else {
//     runner.run();
// }
