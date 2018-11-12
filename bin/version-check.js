
const package = require('../package.json');
const child_process = require('child_process');

module.exports = (ncv) => {
  if (!ncv) {
    try {
      let latestVersion = child_process.execSync(`npm show ${package.name} version`, { timeout: 8000 }).toString().trim();
      if (latestVersion.toString() !== package.version.trim()) {
        logging.log('warn', `"${package.name}" is not in the latest version, please consider updating`);
      }
    } catch (error) { }
  }
};