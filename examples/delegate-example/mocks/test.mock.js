module.exports = {
  robot: {
    cwd: './robots/robot-test',
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
    devices: [
      {
        name: "firefox"
      }
    ]
  }
};