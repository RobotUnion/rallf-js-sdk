module.exports = {
  skills: {
    Facebook: {
      methods: {
        like: {
          callback: (data, task) => {
            if (!data.post) {
              return { error: "'post' parameter is required" };
            }
            return 'Liked post: ' + data.post;
          }
        },
        follow: {
          callback: (data, task) => {
            task.emit('facebook followed', {
              data: {
                resp: 'Followed user'
              }
            });
          }
        },
        getFollows: {
          callback: (data, task) => {
            return [/* List of follows */];
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