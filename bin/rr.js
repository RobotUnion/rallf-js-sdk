#!/usr/bin/env node
'use strict';

const RallfReq  = require('./requester');
const fs        = require('fs');
const readline  = require('readline');
const clc       = require('cli-color');
const exec      = require('child_process').exec;
const CWD       = process.cwd();
const BASE_URL  = 'https://api.robotunion.net';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
let log     = process.stdout;
let blue    = clc.xterm(24);
let warning = clc.xterm(3);
let success = clc.xterm(28);
let errorcl = clc.xterm(1);


function createDevelpoment(profile, account) {
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

let requester = new RallfReq(config);
let indentity;

if(!fs.existsSync(`${CWD}/.robot.dev`)) {

  log.write(warning("Development not found") + ", creating new one...");
  log.write("Listing accounts... ");

  requester.request('GET', '/user/v1/profile', {},
    resp => {
      console.log("Arribed", resp)
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
              createDevelpoment(profile, selectedAccount);
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
        createDevelpoment(profile, selectedAccount);
      }

    });

}
// .robot.dev exists
else{
  indentity = fs.readFileSync(CWD+'/.robot.dev', 'utf8');
  log.write('Compiling...');
  exec('rpkg', function (error, stdout, stderr) {

    if (error) {
      log.write(`   [${errorcl('error')}]\n`);
      log.write(JSON.stringify(error, null, 4));
      rl.close();
    }

    log.write(`   [${success('ok')}]\n`);
    log.write('Uploading...');
    requester.request('POST', 'app/v1/upload',
      {
        file: fs.readFileSync(CWD+'/out/app.tsk', 'utf8')
      },
      (resp) => {
        log.write(`   [${success('ok')}]\n`);
        log.write('Launching...');
        console.log(resp)
      },
      (err) => {
        log.write(`   [${errorcl('error')}]\n`);
        log.write(JSON.stringify(err, null, 4));
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
