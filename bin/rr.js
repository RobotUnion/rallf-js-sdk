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

// Check if manifest exists
if (!fs.existsSync(manifestPath)) {
  log(
    'Could not find ' + blue('./config/manifest.json'),
    '\nPlease create one and try again.'
  );
  rl.close();
  return;
}
/*
  Require manifest and
  set config.url to config.debug_url or the default one
*/
config = require(manifestPath);
config.url = config.debug_url || pkg.base_url;

// Check if secret & key are set in manifest
if (!config.secret || !config.key) {
  log.write(warning(`Please check your manifest.json file, it seems some credentials are not present. [!secret, !key]`))
  rl.close();
  return;
}

requester = new RallfReq(config);
// .robot.dev does not exist
if(!fs.existsSync(robotDevPath)) {
  log.write(`[${warning('warn ')}] Development not found, creating new one...\n`);
  log.write(`[     ] Listing accounts...`);
  requester.request('GET', '/user/v1/profile',
    null,
    resp => {
      log.write(`\r[${success(' ok  ')}] Listing accounts... \n`);
      let profile  = resp.data;
      let totalPermissions = profile.permissions.length;
      console.log(`\nFound ${totalPermissions} ${(totalPermissions == 1 ? 'account':'accounts')}:`);

      let selectedAccount = null;
      if (totalPermissions > 1) {
        for(let i = 0; i < totalPermissions; i++){
          let account = profile.permissions[i].account;
          console.log(` - [${ i }] (${account.name}) ${account.id}`);
        }
        function askSelectAccount() {
          rl.question('\nSelect Account: ', function (selectedIndex) {
            let parsed = parseInt(selectedIndex);
            if (parsed <= totalPermissions) {
              selectedAccount = profile.permissions[parsed].account;
              console.log(`Selected account: [${ parsed }] (${selectedAccount.name}) ${selectedAccount.id}`);
              rl.close();
              createDevelopment(profile, selectedAccount);
            }
            else {
              console.log(`Please enter a number between 1-${totalPermissions}`);
              askSelectAccount()
            }
          });
        }
        askSelectAccount();
      }
      else{
        selectedAccount = profile.permissions[0].account;
        console.log(`Selected account: [1] (${selectedAccount.name}) ${selectedAccount.id}`);
        rl.close();
        createDevelopment(profile, selectedAccount);
      }
    },
    error => {
      log.write(`\r[${errorcl('error')}] Listing accounts... \n`);
      // console.error(error)
      writeLogToFile(JSON.stringify(error));
      rl.close();
    }
  );
}

// .robot.dev exists
else{
  doDevelopmentExecution(false);
}

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
        console.log(`Development found at: ${info(panelUrl+'/developments/session/'+identity.development_id)}`)
        rl.close();
      },
      (err) => {
        log.write(`\r[${errorcl('error')}] Uploading failed\n`);
        writeLogToFile(JSON.stringify(err));
        rl.close();
      }
    )
  });
}
function createDevelopment(profile, account) {
  log.write(`[     ] Creating Development...`);
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
      writeLogToFile(JSON.stringify(error));
      rl.close();
    }
  )
}
function writeLogToFile(msg) {
  let date = (new Date()).toJSON();
  fs.appendFileSync(
    'rr.log',
    `[${date}] - ${msg.replace(/[\n]/g, '')}\n`
  );
  log.write(`[${info('info ')}] check rr.log for further information about the error.`)
}
