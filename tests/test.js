


// console.log({ 'test': "test" });
process.stdin.on('message', (message) => {
  console.log('test.js', message.method);
  process.send({});
  if (message.method === 'sendupdate') {
    process.send({ jsonrpc: '2.0', method: 'update', id: message.id, params: {} });
  }
});

// console.log(process);

process.stdout.write("test");