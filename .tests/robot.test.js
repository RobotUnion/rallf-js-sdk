const { Task, Robot, Logger, Devices } = require('../src/integration');

describe('Robot should', () => {
  it(`be defined`, () => {
    expect(Robot).toBeDefined();
  });

  const isMethodAFunction = (method_name) => () => expect(typeof Robot.prototype[method_name]).toEqual('function');

  it(`contain method: get`, isMethodAFunction('get'));
  it(`contain method: set`, isMethodAFunction('set'));
  it(`contain method: hasPath`, isMethodAFunction('hasPath'));
  it(`contain method: hasPermission`, isMethodAFunction('hasPermission'));
});