#!/usr/bin/env node
'use strict';

const RallfReq  = require('./requester');
const pkg       = require('../package.json');
const fs        = require('fs');
const readline  = require('readline');
const clc       = require('cli-color');
const exec      = require('child_process').exec;
const CWD       = process.cwd();
const BASE_URL  = 'https://api.alpha.rallf.com';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
let log     = process.stdout;
let lgray   = clc.xterm(59).bold;
let info    = clc.xterm(23);
let red     = clc.xterm(9);
let warning = clc.xterm(3);
let success = clc.xterm(28);
let errorcl = clc.xterm(1);

function createDevelopment(profile, account) {
  // echo "Creating new development ... ";
  console.log("Creating new development...");
  // $response = $requester->request('POST', '/user/v1/developments', ['account_id' => $account->id]);
  // $development = $response->data;
  console.log('123123-1sadas-13-123'+ " created OK\n");
  let identity = {
    'user': profile.username,
    'user_id': profile.id,
    'account': account.name,
    'account_id': account.id,
    'development_id': '123124-1sadas-13-123'
  }
  fs.writeFileSync(CWD+'/.robot.dev', JSON.stringify(identity, null, 2));
}

function writeLogToFile(msg) {
  let date = (new Date()).toJSON();
  fs.appendFileSync(
    'rr.log',
    `[${date}] - ${msg.replace(/[\n]/g, '')}\n`
  );
  log.write(`[${info('info ')}] check rr.log for further information about the error.`)
}

// Main logic

let manifestPath = `${CWD}/config/manifest.json`;
if (!fs.existsSync(manifestPath)) {
  log(
    'Could not find ' + blue('./config/manifest.json'),
    '\nPlease create one and try again.'
  );
  rl.close();
  return;
}

let config = require(manifestPath);
config.url = config.debug_url || BASE_URL;

if (!config.secret || !config.key) {
  log.write(warning(`Please check your manifest.json file, it seems some credentials are not present.`))
  rl.close();
  return;
}

let requester = new RallfReq(config);
let indentity;

if(!fs.existsSync(`${CWD}/.robot.dev`)) {
  log.write(`[${warning('warn ')}] Development not found, creating new one...\n`)
  log.write(`[     ] Listing accounts...`);
  requester.request('GET', '/public/v1/version',
    {},
    resp => {
      console.log("version", resp)
    })
  requester.request('GET', '/user/v1/profile',
    {},
    resp => {
      log.write(`\r[${success(' ok ')}] Listing accounts... \n`);
      let profile  = resp;
      let totalPermissions = profile.permissions.length;
      console.log(`Found ${totalPermissions} ${(totalPermissions == 1 ? 'account':'accounts')}:`);

      let selectedAccount = null;
      if (totalPermissions > 1) {
        for(let i = 0; i < totalPermissions; i++){
          let account = profile.permissions[i].account;
          console.log(` - [${ i+1 }] (${account.name}) ${account.id}`);
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
      writeLogToFile(JSON.stringify(error));
      rl.close();
    }
  );

}
// .robot.dev exists
else{
  indentity = JSON.parse(fs.readFileSync(CWD+'/.robot.dev', 'utf8'));
  log.write(`[${success('succs')}] Found development [${info(indentity.development_id)}]\n`);

  log.write(`[     ] Compiling...`);
  exec('rpkg', function (error, stdout, stderr) {

    if (error) {
      log.write(`\r[${errorcl('error')}] Compiling\n`);
      writeLogToFile(error);
      rl.close();
    }

    log.write(`\r[${success('succs')}] Compiled correctly!\n`);
    log.write(`[     ] Uploading...`);
    requester.request('POST', 'app/v1/upload',
      {
        file: fs.readFileSync(CWD+'/out/app.tsk', 'utf8')
      },
      (resp) => {
        log.write(`\r[${success('succs')}] Uploading correctly! \n`);
        log.write('Launching...');
        console.log(resp)
      },
      (err) => {
        log.write(`\r[${errorcl('error')}] Uploading failed\n`);
        writeLogToFile(err);
        rl.close();
      }
    )
  });
}

// echo "[ok]\n";
//
// echo "Uploading ... ";
// $response = $requester->upload('/app/v1/upload', 'out/app.tsk');
// $path = $response->data->src;
// echo "[ok]\n";
//
// echo "Launching ... ";
// $resp = $requester->request(
//     'PATCH',
//     '/user/v1/developments/' . $identity['development_id'],
//     [
//         'name' => $config->name,
//         'package' => $path,
//         'status' => 'launched'
//     ]
// );
//
// switch($resp->status){
//     case "success":
//     case "ok":
//         echo "[ok]\n";
//         break;
//     default:
//         echo "[{$resp->status}]\n";
//         echo "{$resp->message}\n";
//         break;
// }

// Example .robot.dev
// {
//   "user": "johndoe",
//   "user_id": "xxxxxxxxxxxxx-xxxxxxxxxxx-xxxxxxxx-xxxxx",
//   "account": "johndoe",
//   "account_id": "xxxxxxxxxxxxx-xxxxxxxxxxx-xxxxxxxx-xxxxx",
//   "development_id": "xxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxx-xxxxx"
// }
