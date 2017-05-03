#!/usr/bin/env node
'use strict';

const https    = require('https');
const fs       = require('fs');
const exec     = require('child_process').exec;
const readline = require('readline');
const crypto   = require('crypto');
const CWD      = process.cwd();
const BASE_URL = 'https://api.robotunion.net';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class RallfSigner {
  constructor(key) {
      this.secret = key;
  }
  sign(message){
    console.log("ASDASD", this.secret);
    return crypto.createHmac('sha256', this.secret).update(message).digest('hex');
  }
}

let uniqid = function (pr, en) {
	var pr = pr || '', en = en || false, result;

	let seed = function (s, w) {
		s = parseInt(s, 10).toString(16);
		return w < s.length ? s.slice(s.length - w) : (w > s.length) ? new Array(1 + (w - s.length)).join('0') + s : s;
	};

	result = pr + seed(parseInt(new Date().getTime() / 1000, 10), 8) + seed(Math.floor(Math.random() * 0x75bcd15) + 1, 5);

	if (en) result += (Math.random() * 10).toFixed(8).toString();

	return result;
};

class RallfRequester {
  constructor(config) {
    this.config = config;
  }

  buildSignature(){
      // let access_key = "edbeb673024f2d0e23752e2814ca1ac4c589f761";
      // let access_secret = "wlqDEET8uIr5RN00AMuuceI9LLKMTNLpzlETlX3djVg=";
      // let nonce = "1570156405";
      // let timestamp = "1411000260";

      // # access_secret bytes, used later as a key to make the signature
      let access_secret_bin = new Buffer(this.config.secret, 'hex');
      let signer = new RallfSigner(access_secret_bin);

      // # Number used for a single use, see http://en.wikipedia.org/wiki/Cryptographic_nonce
      let nonce = uniqid();

      // # Current unix timestamp, see http://en.wikipedia.org/wiki/Unix_time
      let timestamp = Math.floor((new Date()).getTime() / 1000);

      // # Authentication scheme version, now 1
      let version = 1;
      let signature = signer.sign(this.config.key + nonce + timestamp);

      console.log(`
        Signatureads:
          key: ${this.config.key}
          secret: ${this.config.secret}
          secret_bin: ${access_secret_bin}
          nonce: ${nonce}
          timestamp: ${timestamp}
          signature: ${signature}
      `)

      return `Signature access-key=${this.config.key}, nonce=${nonce}, timestamp=${timestamp}, version=${version}, signature=${signature}`;

  }

  request(method, path, params = [], cb) {
    let signature = this.buildSignature();
    console.log("Signature: "+signature+"\n");
    const options = {
      host: this.config.url,
      path: path,
      method: method,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Signature": signature
      }
    }
    function callback(response) {
      var data = '';
      console.log('headers:', response);
      //another chunk of data has been recieved, so append it to `str`
      response.on('data', function (chunk) {
        console.log('DATA!!!!')
        data += chunk;
      });

      //the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        console.log("datum", data);
        // cb(JSON.parse(data))
        cb(data);
      });
    }
    let req = https.request(options, callback);
    if (method == 'POST') req.write(JSON.stringify(params));
    req.end();
  }
}

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
      'development_id': '123123-1sadas-13-123'
  }
  fs.writeFileSync(CWD+'/.robot.dev', JSON.stringify(identity, null, 2));
}

let config = require(CWD+'/config/manifest.json');
config.url = BASE_URL;

if (config.debug_url) config.url = config.debug_url;

let requester = new RallfRequester(config);
let indentity;

if(!fs.existsSync(CWD+'/.robot.dev')) {

  console.log("Development not found, creating new one...");
  console.log("Listing accounts... ");

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
  console.log("Compiling...");
  exec('rpkg', function (error, stdout, stderr) {

    console.log(
      `[ok]\n`,
      `Uploading...`
    );
    requester.request('POST', 'app/v1/upload', {
      file: fs.readFileSync(CWD+'/out/app.tsk', 'utf8')},
      (resp) => {
        console.log(resp)
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
