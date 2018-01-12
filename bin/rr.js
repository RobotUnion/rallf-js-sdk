#!/usr/bin/env node
'use strict';

/**
 * RobotUnion RALLF Robot Runner { v0.1.0 } 
 * A simple robot runner and deployer
*/

const csol = require('./console.js');
const RallfReq = require('./requester');
const pkg = require('../package.json');
const fs = require('fs');
const exec = require('child_process').exec;
const manifestPath = `${process.cwd()}/config/manifest.json`;
const robotDevPath = `${process.cwd()}/.robot.dev`;
const panelUrl = 'https://alpha.rallf.com/';
const logger = csol.logger;
const readLine = csol.readLine;
const clc = csol.clc;
const log = csol.log;

const Errors = {
  NO_CREDENTIALS: `Please check your manifest.json file, it seems some credentials are not present. [!secret, !key]`,
  NO_MANIFEST: 'Could not find ' + logger.info('./config/manifest.json'),
  NO_DEV_FOUND: `[${logger.warning('warn')}] Development not found, creating new one...\n`
}
const Info = {
  CREATE_MANIFEST: '\nPlease create one and try again.',
  LISTING_ACCOUNTS: `[    ] Listing accounts...`,
  LISTING_ACCOUNTS_OK: `\r[${logger.success('good')}] Listing accounts... \n`,
  COMPILED_OK: `\r[${logger.success('good')}] Compiled correctly!\n`,
  COMPIING: `[    ] Compiling...`,
  UPLOADING: `[    ] Uploading...`,
  UPLOADING_OK: `\r[${logger.success('good')}] Uploading correctly! \n`,
  DEV_FOUND: identity => (
    `\n${logger.success('Development has been created')}: ` +
    `\n  - Dev. Name: ${identity.name}` +
    `\n  - Account:   ${identity.account}` +
    `\n  - Creator:   ${identity.user}` +
    `\n  - Panel Url: ${logger.info(panelUrl + 'developments/session/' + identity.development_id)}\n\n`
  ),
  DEV_CREATED: resp => `\r[${logger.success('good')}] Created development [${logger.info(resp.data.id)}] \n`,
  CREATING_DEV: `\n[    ] Creating Development...`,
  CHECK_LOG: `[${logger.info('info ')}] check rr.log for further information about the error.`
}

!(function () {

  /* If manifest does not exist, throw error and exit */
  if (!fs.existsSync(manifestPath)) {
    log.write(
      Errors.NO_MANIFEST,
      Info.CREATE_MANIFEST
    );
    return readLine.close();
  }

  let config = require(manifestPath);
  config.url = config.debug_url || pkg.base_url;

  /* If manifest does not contain a key or a secret, throw and exit */
  if (!config.secret || !config.key) {
    log.write(logger.warning(Errors.NO_CREDENTIALS))
    return readLine.close();
  }

  let requester = new RallfReq(config);
  let identity;

  /**
   * .robot.dev does not exist, so we should create a new one
   */
  if (!fs.existsSync(robotDevPath)) {
    log.write(Errors.NO_DEV_FOUND);
    log.write(Info.LISTING_ACCOUNTS);
    requester.request('GET', '/user/v1/profile',
      null,
      resp => {
        log.write(Info.LISTING_ACCOUNTS_OK);
        let profile = resp.data;
        let totalPermissions = (profile.permissions || []).length;
        log.write(`\nFound ${totalPermissions} ${(totalPermissions == 1 ? 'account' : 'accounts')} for user ${logger.info(profile.username)}:`);

        let selectedAccount = null;
        if (totalPermissions > 1) {

          /* Lists all account to select from */
          for (let i = 0; i < totalPermissions; i++) {
            let account = profile.permissions[i].account;
            log.write(`\n - [${i}] (${account.name}) ${account.id}`);
          }

          /* Asks to select an account */
          (function askSelectAccount() {
            readLine.question('\nSelect Account: ', function (selectedIndex) {
              let parsed = parseInt(selectedIndex);
              /*
                If entered number 'parsed' is a valid account index
                we use that account to create development
              */
              if (parsed <= totalPermissions) {
                selectedAccount = profile.permissions[parsed].account;
                log.write(`Selected account: [${parsed}] (${selectedAccount.name})\n`);
                createDevelopment(profile, selectedAccount);
              }

              /* If its invalid show message and ask again */
              else {
                log.write(`Please enter a number between 0-${totalPermissions - 1}`);
                askSelectAccount()
              }
            });
          })();
        }

        /* Has only one account so we use it to create the development */
        else {
          selectedAccount = profile.permissions[0].account;
          readLine.clearLine();
          log.write(`\r\r\rSelected account: [1] (${selectedAccount.name}) ${selectedAccount.id}`);
          createDevelopment(profile, selectedAccount);
        }
      },
      errorMessageFactory('Listing accounts')
    );
  }

  /**
   * .robot.dev does exist, so we should update the existing one
   */
  else doDevelopmentExecution(false);

  /**
  * @function doDevelopmentExecution
  *   - It will compile project and uploaded to the development specified in .robot.dev
  * @param {boolean} justCreatedDev - the users profile
  */
  function doDevelopmentExecution(justCreatedDev) {
    identity = JSON.parse(fs.readFileSync(robotDevPath, 'utf8'));
    if (!justCreatedDev) log.write(Info.DEV_FOUND(identity));

    log.write(Info.COMPIING);
    exec('rpkg', function (error, stdout, stderr) {
      if (error) {
        errorMessageFactory('Compiling')(error);
      }

      log.write(Info.COMPILED_OK);
      log.write(Info.UPLOADING);
      requester.upload('/app/v1/upload',
        process.cwd() + '/out/app.tsk',
        (resp) => {
          log.write(Info.UPLOADING_OK);
          log.write(Info.DEV_FOUND(identity))
          readLine.close();
        },
        errorMessageFactory('Uploading failed')
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
    log.write(Info.CREATING_DEV);
    requester.request('POST', '/user/v1/developments', { 'account_id': account.id, 'name': config.name || '' },
      resp => {
        log.write(Info.DEV_CREATED(resp));
        identity = {
          'user': profile.username,
          'user_id': profile.id,
          'account': account.name,
          'account_id': account.id,
          'development_id': resp.data.id,
          'name': config.name
        }
        fs.writeFileSync(process.cwd() + '/.robot.dev', JSON.stringify(identity, null, 2));
        doDevelopmentExecution(true);
      },
      error => {
        log.write(`\r[${logger.error('error')}] Creating Development...\n`);
        writeLogToFile(error);
        readLine.close();
      }
    )
  }

  /**
  * @function writeLogToFile
  * @param {object|string} msg - the message to write to rr.log
  */
  function writeLogToFile(msg) {
    let date = (new Date()).toJSON();
    console.log("ERROR: ", msg);

    msg = JSON.stringify(msg);
    fs.appendFileSync(
      'rr.log',
      `[${date}] - ${msg.replace(/[\n]/g, '')}\n`
    );
    log.write(Info.CHECK_LOG)
  }

  /**
  * @function writeLogToFile
  * @param {object|string} msg - the message to write to rr.log
  */
  function errorMessageFactory(msg) {
    return function (error) {
      log.write(`\r[${logger.error('error')}] ${msg}... \n`);
      writeLogToFile(error);
      readLine.close();
    }
  }
})();
