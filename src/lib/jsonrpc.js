'use strict';

const Validator = require('jsonschema').Validator;
const schemes = require('./schemes');
const rpiecy = require('json-rpiecy');
const fs = require('fs-extra');

// console.log("Requiring rpc " + __dirname);
// fs.createFileSync('C:\\Users\\keff\\Desktop\\cosas\\Dev\\Trabajo\\RobotUnion\\@rallf\\rallf-node\\debug.txt');
// fs.writeFileSync('C:\\Users\\keff\\Desktop\\cosas\\Dev\\Trabajo\\RobotUnion\\@rallf\\rallf-node\\debug.txt', JSON.stringify(require.main));

const jsonrpc = {
  rpiecy,
  id: Math.random(),
  version: '2.0',
  request_template: {
    jsonrpc: '2.0',
    params: {},
    method: 'no-method',
    id: 1
  },
  response_template: {
    jsonrpc: '2.0',
    method: 'no-method',
    id: 1
  },
  error_template: {
    code: 0,
    message: '',
    data: {}
  },
  subs: {},
  isValidRequest(object) {
    const v = new Validator();
    let validation = v.validate(object, schemes.jsonRpcRequest);
    if (validation.errors) return { error: true, errors: validation.errors };
  },
  isValidResponse(object) {
    const v = new Validator();
    let validation = v.validate(object, schemes.jsonRpcResponse);
    if (validation.errors) return { error: true, errors: validation.errors };
  },
  request(method, params, id) {
    if (!id) id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10);

    return {
      ...this.request_template,
      method,
      params,
      id,
      valueOf() {
        return this;
      },
      toString() {
        return JSON.stringify(this);
      }
    };
  },
  response(method, id, result, error) {
    let response = { ...this.response_template, method, id };
    if (error) response.error = error;
    if (!error) response.result = result;
    return response;
  },
  waitFor(method, id) {
    return new Promise((resolve, reject) => {
      let timeOut = setTimeout(() => {
        reject(jsonrpc.response(request.method, request.id, null, {
          code: this.TIMED_OUT,
          message: 'request timed out',
          data: {}
        }));
      }, 30e3);

      let str;
      const onResponse = (response) => {
        try {
          response = JSON.parse(response);
          let validResponse = this.isValidResponse(response);
          let methodsMatch = method === response.method;
          let idsMatch = id === response.id;

          if (
            validResponse &&
            methodsMatch &&
            idsMatch
          ) {
            resolve(response);
            clearTimeout(timeOut);
          }
          else if (response.error) {
            reject(jsonrpc.response(request.method, request.id, null, response.error));
            clearTimeout(timeOut);
          }
        } catch (error) {
          reject(jsonrpc.response(request.method, request.id, null, {
            code: this.INTERNAL_ERROR,
            message: 'there has been an error',
            data: error
          }));
          clearTimeout(timeOut);
        }

        if (str.destroy) str.destroy();
      };

      str = process.stdin.on('message', onResponse);

      this.on('response', onResponse);

    });
  },
  on(event, callback) {
    console.log("on(" + event + ") " + this.id);
    if (this.subs[event] && this.subs[event].callbacks) {
      this.subs[event].callbacks.push(callback);
    } else {
      this.subs[event] = {
        callbacks: [callback]
      };
    }
  },
  off(event) {
    if (event in this.subs) {
      delete this.subs[event];
    }
  },
  emit(event, data) {
    if (event in this.subs) {
      let cbacks = this.subs[event].callbacks;
      for (let cback of cbacks) {
        cback(data, event);
      }
    }
  },

  /**
   * 
   * @param {function(response,error?):void} callback 
   * @param {object} options 
   * @param {object} options.method
   * @param {object} options.id
   */
  onAny(options) {
    return new Promise((resolve, reject) => {
      this.on('request', (request) => {
        try {
          let validResponse = this.isValidRequest(request);
          if (validResponse) resolve(request, null);
          else if (request.error) reject(request.error);
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  /**
   * @param {rpiecy.Request} request - must be valid jsonrpc request object 
   * @returns {Promise<any>}
   */
  sendAndAwaitForResponse(request, task) {
    request.output();

    return new Promise((resolve, reject) => {
      console.log('Listening for: ' + 'response:' + request.id);
      task.on('response:' + request.id, (resp) => {
        console.log('Received awaited response: ', resp);
      });
    });

    // return rpiecy.Request.waitFor(request.id)
    //   .then(resp => {
    //     console.log('Received awaited response: ', resp);
    //     return resp;
    //   });
    // return new Promise((resolve, reject) => {
    //   request.sendAndWait();
    //   // process.stdout.write(request + '\n');

    //   // let timeOut = setTimeout(() => {
    //   //   reject(jsonrpc.response(request.method, request.id, null, {
    //   //     code: this.TIMED_OUT,
    //   //     message: 'request timed out',
    //   //     data: {}
    //   //   }));
    //   // }, 6e4); // 6 minutes

    //   // process.stdin.on('message', (response) => {
    //   //   console.log("On message: " + response);
    //   //   try {
    //   //     response = JSON.parse(response);
    //   //     let validResponse = this.isValidResponse(response);
    //   //     let idsMatch = request.id === response.id;

    //   //     if (
    //   //       validResponse &&
    //   //       idsMatch
    //   //     ) {
    //   //       clearTimeout(timeOut);
    //   //       resolve(response);
    //   //     }
    //   //     else if (response.error) {
    //   //       clearTimeout(timeOut);
    //   //       reject(jsonrpc.response(request.method, request.id, null, response.error));
    //   //     }
    //   //     else if (!idsMatch) {
    //   //       clearTimeout(timeOut);
    //   //       reject(jsonrpc.response(request.method, request.id, null, {
    //   //         code: this.INTERNAL_ERROR,
    //   //         message: 'id\'s do not match',
    //   //         data: error
    //   //       }));
    //   //     }
    //   //   } catch (error) {
    //   //     clearTimeout(timeOut);
    //   //     reject(jsonrpc.response(request.method, request.id, null, {
    //   //       code: this.INTERNAL_ERROR,
    //   //       message: 'there has been an error',
    //   //       data: error
    //   //     }));
    //   //   }
    //   // });
    // });
  },

  error(method, id, code, message, data = {}) {
    return this.response(method, id, null, { code, message, data });
  },
  log() { },


  INTERNAL_ERROR: -32603,
  INVALID_PARAMS: -32602,
  METHOD_NOT_FOUND: -32601,
  INVALID_REQUEST: -32600,
  PARSE_ERROR: -32700,
  TIMED_OUT: -32001
};


module.exports = jsonrpc;
