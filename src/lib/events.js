'use strict';
const EventEmitter = require('events').EventEmitter;
let subSymbol = '__subscriptions';

/**
 * A little pub sub class
 * @deprecated in favor of RallfEventEmitter
 */
class PubSub {
  constructor() {
    this[subSymbol] = {};
  }

  onAny(event, data) {

  }

  /**
   * Subscribe to an event
   * @param {string} event 
   * @param {function} callback 
   */
  once(event, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback argument must be type "function" given: ' + (typeof callback));
    }


    if (this[subSymbol][event] && this[subSymbol][event].callbacks) {
      this[subSymbol][event].callbacks.push(callback);
      this[subSymbol][event].onlyOnce = true;
    } else {
      this[subSymbol][event] = {
        callbacks: [callback],
        onlyOnce: true
      }
    }
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
      this[subSymbol][event].onlyOnce = false;
    } else {
      this[subSymbol][event] = {
        callbacks: [callback],
        onlyOnce: false
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

      // Emit any event through onAny
      this.onAny(event, data);

      for (let cback of cbacks) {
        cback(data, event);
      }

      if (this[subSymbol][event].onlyOnce) {
        delete this[subSymbol][event];
      }
    }
  }
}

class RallfEventEmitter extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Listens for any event
   * !! Should be overwriten ¡¡ 
   * @param {function(event: string, data: any)} listener 
   */
  onAny() {
    return null;
  }

  emit(e) {
    this.onAny(e, ...arguments);
    super.emit(...arguments);
  }
}


module.exports = {
  RallfEventEmitter,
  PubSub
}