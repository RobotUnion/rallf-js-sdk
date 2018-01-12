const csol = require('./console.js');
const fs = require('fs');
const logger = csol.logger;
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
  let taskName = logger.info(`${config.name}@${config.version_name}`);
  console.log(`\nRunning Task\n` +
    `  Task:  ${taskName}\n` +
    `  Host:  ${logger.info(selenium_url)}\n` +
    `  Debug: ${logger.info(debug_id)}\n` +
    `  Env:   ${logger.info(env)}\n`
  )

  const wdClient = require('wd');
  const driver = wdClient.remote(selenium_url, 5555)//wdClient.remote(this.browsers[0]);
  const Task = require(config.main);

  let taskLogger;

  if (debug_id != 'null') {
    taskLogger = new RallfLogger();
  } else {
    taskLogger = new ConsoleLogger();
  }


  let task = new Task()
  task.setDevice(driver);
  task.setLogger(taskLogger);
  task.setRobot(robot);
  task.setInput(input);

  if (env === 'test') task.mock()
  if (env === 'real') task.run()

  task.onFinish = function () {
    console.log('\n\n')
    process.exit();
  };
})()