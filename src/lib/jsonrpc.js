'use strict';

const Validator = require('jsonschema').Validator;
const schemes = require('./schemes');

const jsonrpc = {
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

  /**
   * @param {object} request - must be valid jsonrpc request object 
   * @returns {Promise<any>}
   */
  sendAndAwaitForResponse(request) {
    return new Promise((resolve, reject) => {
      process.stdout.write(request + '\n');

      let timeOut = setTimeout(() => {
        reject(jsonrpc.response(request.method, request.id, null, {
          code: this.TIMED_OUT,
          message: 'request timed out',
          data: {}
        }));
      }, 10e3);

      process.stdin.on('message', (response) => {
        try {
          response = JSON.parse(response);
          let validResponse = this.isValidResponse(response);
          let idsMatch = request.id === response.id;

          if (
            validResponse &&
            idsMatch
          ) {
            clearTimeout(timeOut);
            resolve(response);
          }
          else if (response.error) {
            reject(jsonrpc.response(request.method, request.id, null, response.error));
          }
          else if (!idsMatch) {
            reject(jsonrpc.response(request.method, request.id, null, {
              code: this.INTERNAL_ERROR,
              message: 'id\'s do not match',
              data: error
            }));
          }
        } catch (error) {
          clearTimeout(timeOut);
          reject(jsonrpc.response(request.method, request.id, null, {
            code: this.INTERNAL_ERROR,
            message: 'there has been an error',
            data: error
          }));
        }
      });
    });
  },



  INTERNAL_ERROR: -32603,
  INVALID_PARAMS: -32602,
  METHOD_NOT_FOUND: -32601,
  INVALID_REQUEST: -32600,
  PARSE_ERROR: -32700,
  TIMED_OUT: -32001
};


module.exports = jsonrpc;
