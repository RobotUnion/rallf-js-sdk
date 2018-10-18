#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const clc = require('cli-color');
const program = require('commander');
const logging = require('../src/lib/logging');
const package = require('../package.json');
const readline = require('readline');
const child_process = require('child_process');

// try {
//   let latestVersion = child_process.execSync(`npm show ${package.name} version`);

//   if (latestVersion !== package.version) {
//     logging.log('warn', `"${package.name}" is not in the latest version, please consider updating`);
//   }
// } catch (error) { }

let cwd = process.cwd();
let folderName = path.parse(cwd).base;
let nameGoodFormat = folderName.replace(/[ ]/g, '-').replace(/[@$]/g, '').toLowerCase();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let initQuestions = [
  {
    "key": "name",
    "description": "Set a name for your task, the one displayed at market.rallf.com",
    "default": nameGoodFormat,
    "pattern": /^[\w\d-_.@$]*$/,
    "example": "task-name"
  },
  {
    "key": "fqtn",
    "description": "This is a unique identifier for your task, must be a valid FQDN",
    "default": `com.${nameGoodFormat}.task`,
    "pattern": /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.){2,}([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]){2,}$/,
    "example": "com.example.task"
  }
];

let manifestTemplate = {
  sdk_version: package.version
};

program.version(package.version);

function replaceVars(str, vars) {
  str = String(str);
  for (let key in vars) {
    let var_ = vars[key];
    logging.log('info', `Replacing: <${key}> with value: ${var_} from: ${typeof str}`);
    str = str.replace(new RegExp(`<${key}>`, 'g'), var_);
  }
  return str;
}

function copyFile(origin, target, vars) {

  target = target.replace('.tmpl', '');

  logging.log('info', 'copy file: ' + target);
  let content = fs.readFileSync(origin) || '';
  content = replaceVars(content, vars);

  // This ensures the file is created, even if dirs not exist
  fs.ensureFileSync(target);

  fs.writeFileSync(target, content);
  // logging.log('info', 'copied file: ' + target);
}

function toPascalCase(str) {
  return str.match(/[a-z]+/gi)
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
    })
    .join('');
}

function copyTemplate() {
  let templatePath = __dirname.replace('bin', '') + '/examples/init-template';
  let templateFiles = [
    {
      path: 'config/manifest.json',
      vars: manifestTemplate
    },
    {
      path: 'package.json',
      vars: manifestTemplate
    },
    {
      path: 'src/main.js.tmpl',
      vars: { ...manifestTemplate, name: toPascalCase(manifestTemplate.name) }
    },
    'mocks/test.mock.js',
    'robots/test-robot/data.json'
  ];

  for (let file of templateFiles) {
    let vars = {};
    if (file.vars) vars = file.vars;
    if (file.path) file = file.path;

    copyFile(path.join(templatePath, file), path.join(cwd, file), vars);
  }

  logging.log('info', 'Installing dependencies, please wait...', cwd);

  let p = child_process.exec(`cd ${cwd} && npm install`);
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
  // let p = child_process.spawn(`npm`, [`--prefix ${cwd}`, 'install', cwd], { stdio: [process.stdin, process.stdout, process.stderr] });
  // p.on('error', (error) => {
  //   logging.log('error', error);
  //   logging.log('error', `npm install failed, please try doing it yourself...`);
  // });
  p.on('exit', (exit_code) => {
    if (exit_code === 0) logging.log('info', `To run the task you can do: npm start`);
  });
}

/**
 * 
 * @param {any[]} questions 
 */
function askForData(questions) {
  let question = questions[0];
  rl.question(`${question.description}\n ${question.key} (${clc.blackBright(question.default)}): `,
    (answer) => {
      if (!answer && question.default) {
        answer = question.default;
      }

      if (!question.pattern.test(answer)) {
        logging.log('\rerror', question.key + ' is not valid format, example: ' + question.example);
        askForData(questions);
      }
      else {
        manifestTemplate[question.key] = answer;

        if (questions.length > 1) {
          askForData(questions.slice(1));
        } else {
          logging.log('info', 'Saving manifest.json');
          rl.close();
          copyTemplate();
        }
      }
    });
}

function isTask() {
  return fs.existsSync(path.join(cwd, 'config/manifest.json'));
}

if (isTask()) {
  logging.log('warn', `Folder ./${folderName} is already a rallf-task project`);
  process.exit();
}


logging.log('info', 'running command: init');
logging.log('info', 'Answer the following questions to initialize rallf-task project\n');


askForData(initQuestions);

program.parse(process.argv);
