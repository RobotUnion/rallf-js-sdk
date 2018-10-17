'use strict';


let subSymbol = Symbol('subscriptions');

/**
 * A little pub sub class
 */
class PubSub {
  constructor() {
    this[subSymbol] = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event 
   * @param {function} callback 
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback argument must be type "function" given: ' + (typeof callback));
    }

    if (this[subSymbol][event] && this[subSymbol][event].callbacks) {
      this[subSymbol][event].callbacks.push(callback);
    } else {
      this[subSymbol][event] = {
        callbacks: [callback]
      };
    }
  }

  /**
   * Unsubscribe to an event
   * @param {string} event 
   */
  off(event) {
    if (event in this[subSymbol]) {
      delete this[subSymbol][event];
    }
  }


  /**
   * Emit an event to all subcriptions
   * @param {string} event 
   * @param {any} data 
   */
  emit(event, data) {
    if (event in this[subSymbol]) {
      let cbacks = this[subSymbol][event].callbacks;
      for (let cback of cbacks) {
        cback(data, event);
      }
    }
  }
}

module.exports = PubSub;