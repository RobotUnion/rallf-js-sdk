module.exports = {
  skills: {
    Facebook: {
      methods: {
        like: {
          callback: (data, task) => {
            task.emit('facebook liked', {
              data: {
                resp: 'Liked task'
              }
            });
          }
        }
      }
    }
  },
  robot: {
    cwd: './robots/robot-test'
  },
  devices: [
    {
      name: "firefox",
      path: 'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
      profile: 'C:\\Users\\keff\\Desktop\\cosas\\RobotData\\firefox-profile'
    }
  ]
};