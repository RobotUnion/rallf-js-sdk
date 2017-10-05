#!/usr/bin/env node
'use strict';

const { clc, log, lgray, info, red, warning, success, errorcl, rl } = require('./clc.js');
const RallfReq     = require('./requester');
const pkg          = require('../package.json');
const fs           = require('fs');
const exec         = require('child_process').exec;
const manifestPath = `${process.cwd()}/config/manifest.json`;
const robotDevPath = `${process.cwd()}/.robot.dev`;
const panelUrl     = 'https://alpha.rallf.com/'
let requester, identity, config;

if (!fs.existsSync(manifestPath)) {
  console.log(
    'Could not find ' + info('./config/manifest.json'),
    '\nPlease create one and try again.'
  );
  process.exit();
  return rl.close();
}

config = require(manifestPath);
config.url = config.debug_url || pkg.base_url;

if (!config.secret || !config.key) {
  log.write(warning(`Please check your manifest.json file, it seems some credentials are not present. [!secret, !key]`))
  return rl.close();
}

requester = new RallfReq(config);

if(!fs.existsSync(robotDevPath)) {
  log.write(`[${warning('warn ')}] Development not found, creating new one...\n`);
  log.write(`[     ] Listing accounts...`);
  requester.request('GET', '/user/v1/profile',
    null,
    resp => {
      log.write(`\r[${success(' ok  ')}] Listing accounts... \n`);
      let profile  = resp.data;
      let totalPermissions = profile.permissions.length;
      log.write(`\nFound ${totalPermissions} ${(totalPermissions == 1 ? 'account':'accounts')}:`);

      let selectedAccount = null;
      if (totalPermissions > 1) {

        /* Lists all account to select from */
        for(let i = 0; i < totalPermissions; i++){
          let account = profile.permissions[i].account;
          log.write(`\n - [${ i }] (${account.name}) ${account.id}`);
        }

        /* Asks to select an account */
        (function askSelectAccount() {
          rl.question('\nSelect Account: ', function (selectedIndex) {
            let parsed = parseInt(selectedIndex);
            /*
              If entered number 'parsed' is a valid account index
              we use that account to create development
            */
            if (parsed <= totalPermissions) {
              selectedAccount = profile.permissions[parsed].account;
              log.write(`Selected account: [${ parsed }] (${selectedAccount.name}) ${selectedAccount.id}\n`);
              rl.close();
              createDevelopment(profile, selectedAccount);
            }

            /* If its invalid show message and ask again */
            else {
              log.write(`Please enter a number between 0-${totalPermissions-1}`);
              askSelectAccount()
            }
          });
        })();
      }

      /* Has only one account so we use it to create the development */
      else{
        selectedAccount = profile.permissions[0].account;
        rl.clearLine();
        log.write(`\r\r\rSelected account: [1] (${selectedAccount.name}) ${selectedAccount.id}`);
        rl.close();
        createDevelopment(profile, selectedAccount);
      }
    },
    error => {
      log.write(`\r[${errorcl('error')}] Listing accounts... \n`);
      writeLogToFile(error);
      rl.close();
    }
  );
}
else doDevelopmentExecution(false);

/**
* @function doDevelopmentExecution
*   - It will compile project and uploaded to the development specified in .robot.dev
* @param {boolean} justCreatedDev - the users profile
*/
function doDevelopmentExecution(justCreatedDev) {
  identity = JSON.parse(fs.readFileSync(robotDevPath, 'utf8'));
  if(!justCreatedDev) log.write(`[${success('succs')}] Found development [${info(identity.development_id)}]\n`);

  log.write(`[     ] Compiling...`);
  exec('rpkg', function (error, stdout, stderr) {
    if (error) {
      log.write(`\r[${errorcl('error')}] Compiling\n`);
      writeLogToFile(error);
      rl.close();
    }

    log.write(`\r[${success('succs')}] Compiled correctly!\n`);
    log.write(`[     ] Uploading...`);
    requester.upload('/app/v1/upload',
      process.cwd()+'/out/app.tsk',
      (resp) => {
        log.write(`\r[${success('succs')}] Uploading correctly! \n`);
        log.write(`Development found at: ${info(panelUrl+'developments/session/'+identity.development_id)}`)
        rl.close();
      },
      (err) => {
        log.write(`\r[${errorcl('error')}] Uploading failed\n`);
        writeLogToFile(err);
        rl.close();
      }
    )
  });
}

/**
* @function createDevelopment
*   - It will create a development and will create a .robot.dev file at .
* @param {object} profile - the users profile
* @param {object} account - the users account
*/
function createDevelopment(profile, account) {
  log.write(`\n[     ] Creating Development...`);
  requester.request('POST', '/user/v1/developments', {'account_id': account.id, 'name': config.name || ''},
    resp => {
      log.write(`\r[${success('  ok ')}] Created development [${info(resp.data.id)}] \n`);
      identity = {
        'user': profile.username,
        'user_id': profile.id,
        'account': account.name,
        'account_id': account.id,
        'development_id': resp.data.id
      }
      fs.writeFileSync(process.cwd()+'/.robot.dev', JSON.stringify(identity, null, 2));
      doDevelopmentExecution(true);
    },
    error => {
      log.write(`\r[${errorcl('error')}] Creating Development...\n`);
      writeLogToFile(error);
      rl.close();
    }
  )
}

/**
* @function writeLogToFile
* @param {object|string} msg - the message to write to rr.log
*/
function writeLogToFile(msg) {
  let date = (new Date()).toJSON();
  console.log("ERROR: ", msg.code || msg);

  msg = JSON.stringify(msg);
  fs.appendFileSync(
    'rr.log',
    `[${date}] - ${msg.replace(/[\n]/g, '')}\n`
  );
  log.write(`[${info('info ')}] check rr.log for further information about the error.`)
}
