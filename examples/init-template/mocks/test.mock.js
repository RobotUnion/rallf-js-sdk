module.exports = {
  robot: {
    cwd: './robots/robot-test',
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
    }
  },
  devices: [
    {
      name: "firefox",
      profile: 'C:\\Users\\keff\\Desktop\\cosas\\RobotData\\firefox-profile'
    }
  ]
};