'use strict';
const https   = require('https');
const crypto  = require('crypto');
const request = require('request');
const fs      = require('fs');

/**
*  @class {RallfSigner} - Used to sign messages
*  @param {String} key  - Secret key
*/
class RallfSigner{
  constructor(key){
    this.secret = key;
  }

  /**
  * @method {sign}
  * @param  {String} message - the message to sign
  * @return {String} - hex string
  */
  sign(message) {
    return crypto.createHmac('sha256', this.secret).update(message).digest('hex');
  }
}

/**
*  @class {RallfRequester}
*  @param {Object} config
*/
class RallfRequester {
  constructor(config) {
    this.config = config;
  }

  /**
  * @method {buildSignature}
  * @return {String} - 'Signature access-key="", nonce="", timestamp="", version="", signature=""';
  */
  buildSignature(){

      // # access_secret bytes, used later as a key to make the signature
      let access_secret_bin = new Buffer(this.config.secret, 'hex');
      let signer = new RallfSigner(access_secret_bin);

      // # Number used for a single use, see http://en.wikipedia.org/wiki/Cryptographic_nonce
      let nonce = uniqid();

      // # Current unix timestamp, see http://en.wikipedia.org/wiki/Unix_time
      let timestamp = Math.floor(Date.now() / 1000);

      // # Authentication scheme version, now 1
      let version = 1;
      let signature = signer.sign(this.config.key + nonce + timestamp);

      return 'Signature access-key="'+this.config.key+'", nonce="'+nonce+'", timestamp="'+timestamp+'", version="'+version+'", signature="'+signature+'"';
  }

  /**
  * @method {request}
  * @param {String}   method   - 'POST' | 'GET' | ...
  * @param {String}   path     - 'user/v1/accounts'
  * @param {Object}   params   - {...}
  * @param {function} cb       - callback function
  * @param {function} cb_error - error callback function
  */
  request(method, path, params, cb, cb_error) {
    let signature = this.buildSignature(), req;
    const options = {
      host: this.config.url,
      path: path,
      method: method,
      url: this.config.url+path,
      port: null,
      ignore_errors: true,
      headers: {
        // "accept": "application/json",
        // "content-type": "application/json",
        "X-Signature": signature
      }
    }
    function callback(response) {
      let data = '';
      response.on('data', function (chunk) {
        data += chunk;
      });
      response.on('end', function () {
        let isValidJson = isJsonString(data);
        data = isValidJson ? JSON.parse(data): data;
        if (data.error || !isValidJson) {
          if (cb_error && typeof cb_error == 'function') {
            cb_error(data);
          }
        }
        else if (cb && typeof cb == 'function')
          cb(data);
      });
    }
    req = https.request(options, callback);
    req.on('error', function(err) {
      if (cb_error && typeof cb_error == 'function')
        cb_error(err);
    });
    if (method == 'POST') req.write(JSON.stringify(params));
    req.end();
  }
  upload(path, file, cb, cb_error){
    let signature = this.buildSignature(), req;
    const options = {
      host: this.config.url,
      path: path,
      method: 'POST',
      url: 'https://'+this.config.url+path,
      port: null,
      ignore_errors: true,
      headers: {
        "accept": "application/json",
        "content-type": "multipart/form-data",
        "X-Signature": signature
      }
    }
    function callback(err, httpresp, response) {
      if (err) {
        cb_error(err);
      }
      else{
        cb(response)
      }
    }
    req = request(options, callback);
    var form = req.form();
    form.append('file', fs.createReadStream(file));
  }
}


function uniqid (pr, en) {
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
      return true;
    } catch (e) {
      return false;
    }
}


module.exports = RallfRequester;
