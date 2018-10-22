const { Task, Robot, Logger, Devices } = require('../src/integration');

describe('Robot should', () => {
  it(`be defined`, () => {
    expect(Robot).toBeDefined();
  });

  const isMethodAFunction = (method_name) => () => expect(typeof Robot.prototype[method_name]).toEqual('function');

  it(`contain method: saveJSON`, isMethodAFunction('saveJSON'));
  it(`contain method: readJSON`, isMethodAFunction('readJSON'));
  it(`contain method: exists`, isMethodAFunction('exists'));
  it(`contain method: existsSync`, isMethodAFunction('existsSync'));
  it(`contain method: delegateLocal`, isMethodAFunction('delegateLocal'));
  it(`contain method: delegateExternal`, isMethodAFunction('delegateExternal'));
  
  // it(`contain method: set`, isMethodAFunction('set'));
  // it(`contain method: hasPath`, isMethodAFunction('hasPath'));
  // it(`contain method: hasPermission`, isMethodAFunction('hasPermission'));
});