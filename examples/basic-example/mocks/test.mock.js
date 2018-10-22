module.exports = {
  robot: {
    cwd: './robots/robot-test',
    skills: {
      Facebook: {
        methods: {
          like: {
            callback: (data, task) => {

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