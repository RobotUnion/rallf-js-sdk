'use strict';
const https  = require('https');
const crypto = require('crypto');

function RallfSigner(key){
  this.secret = key;
}
RallfSigner.prototype.sign = function(message) {
  return crypto.createHmac('sha256', this.secret).update(message).digest('hex');
}

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

      // console.log(`
      //   Signature:
      //     key: ${this.config.key}
      //     secret: ${this.config.secret}
      //     secret_bin: ${access_secret_bin}
      //     nonce: ${nonce}
      //     timestamp: ${timestamp}
      //     signature: ${signature}
      // `)

      return `Signature access-key=${this.config.key}, nonce=${nonce}, timestamp=${timestamp}, version=${version}, signature=${signature}`;

  }
  request(method, path, params, cb, cb_error) {
    let signature = this.buildSignature();
    // console.log("Signature: "+signature+"\n");
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
      let data = '';
      response.on('data', function (chunk) {
        data += chunk;
      });
      response.on('end', function () {
        if (isJsonString(data)) {
          data = JSON.parse(data);
        }
        if (data.error || !isValidJson) {
          if (cb_error && typeof cb_error == 'function') {
            cb_error(data);
          }
        }
        else if (cb && typeof cb == 'function') {
          cb(data);
        }
      });
    }
    let req = https.request(options, callback);
    req.on('error', function(err) {
      if (cb_error && typeof cb_error == 'function') {
        cb_error(err);
      }
    });
    if (method == 'POST') req.write(JSON.stringify(params));
    req.end();
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
function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
module.exports = RallfRequester;
