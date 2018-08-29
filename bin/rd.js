const csol = require('./console.js');
const fs = require('fs');
const logger = csol.logger;
const log = csol.log;
const manifestPath = `${process.cwd()}/config/manifest.json`;

const ConsoleLogger = require('../src/RALLF/Integration/ConsoleLogger');
const RallfLogger = require('../src/RALLF/Integration/RallfLogger');


const Errors = {
  NO_MANIFEST: 'Could not find ' + logger.info('./config/manifest.json')
}
const Info = {
  CREATE_MANIFEST: '\nPlease create one and try again.',
  USAGE: "Usage: \n  rd <selenium_url> <json_robot> <json_input> [<debug_id>] [<env>]\n"
}

let args = process.argv.slice(2);
let [
  selenium_url,
  robot,
  input,
  debug_id,
  env
] = args;

if (!env) env = 'real';

// console.log(
//   selenium_url,
//   robot,
//   input,
//   debug_id,
//   env
// )

!(function () {

  /* If args less than for, show usage message */
  if (args.length < 3) {
    log.write(
      Info.USAGE
    )
    process.exit();
  }

  /* If manifest does not exist, throw error and exit */
  if (!fs.existsSync(manifestPath)) {
    log.write(
      Errors.NO_MANIFEST,
      Info.CREATE_MANIFEST
    );
    process.exit();
  }

  const config = require(manifestPath);
  let taskName = logger.success(`${config.name}@${config.version_name}`);
  console.log(`\nRunning Task: ${taskName}\n` +
    `  Host:   ${logger.info(selenium_url)}\n` +
    `  Debug:  ${(debug_id)}\n` +
    `  Input:  ${(input)}\n` +
    `  Roboot: ${(robot)}\n` +
    `  Env:    ${logger.warning(env)}\n`
  )

  const wdClient = require('wd');
  const driver = wdClient.remote(selenium_url, 4444);
  const Task = require('../' + config.main);

  let taskLogger;

  if (debug_id) {
    console.log('rallf', debug_id);
    taskLogger = new RallfLogger();
  } else {
    console.log('console');
    taskLogger = new ConsoleLogger();
  }


  let task = new Task()
  task.setDevice(driver);
  task.setLogger(taskLogger);
  console.log(taskLogger);
  task.setRobot(JSON.parse(robot));
  task.setInput(JSON.parse(input));

  if (env === 'test') task.mock()
  if (env === 'real') task.run()

  task.onFinish = function () {
    driver.quit();
    process.exit();
  };
})()