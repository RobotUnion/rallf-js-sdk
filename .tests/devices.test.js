const { Task, Robot, Logger, Devices } = require('../src/integration');

describe('Devices should', () => {
  it(`be defined`, () => {
    expect(Devices).toBeDefined();
  });

  const isMethodAFunction = (method_name) => () => expect(typeof Devices.prototype[method_name]).toEqual('function');

  it(`contain method: get`, isMethodAFunction('get'));
});