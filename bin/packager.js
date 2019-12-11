#!/usr/bin/env node


const program = require('commander');
const path = require('path');
const clc = require('cli-color');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');

const { logger } = require('../src/lib/logging');
const checker = require('../src/lib/checker');
const pkg = require('../package.json');
const Runner = require('../src/lib/runner');

const INCLUDED_FILES = [
  'config/manifest.json',
  'src/',
  'package.json',
];

const loggerPackager = logger.clone({ channel: 'packager' });

program.version(pkg.version);
program.option('--nvc', 'Don\'t check version', false);
program.option('-i, --input-path <input_path>', 'Specify an input path', path.join(process.cwd()));
program.option('-o, --output-path <output_path>', 'Specify an outut path', path.join(process.cwd(), 'output'));

/**
 * @param {*} colorName 
 * @param {*} str 
 * @param {*} colorEnabled 
 */
function color(colorName, str, colorEnabled = true) {
  if (colorEnabled) {
    try {
      str = clc[colorName](str);
    } catch (error) { }
  }

  return str;
}

/**
 * @param {*} byteLen 
 */
function getByteSize(byteLen) {
  let size = byteLen / 1000000.0;
  let label = ' mb';

  if (size < 0.01) {
    size = byteLen;
    label = ' bytes';
  } else {
    size = byteLen / 1000000.0;
    label = ' mb';
  }

  return size + label;
}

program.action((cmd) => {
  let exists = fs.existsSync(cmd.inputPath);
  if (!exists) {
    loggerPackager.error('Input path does not exists: ' + cmd.inputPath);

    return process.exit(1);
  }

  // Check if is valid task
  const rallfRunner = new Runner();
  const manifest = rallfRunner.getManifest(cmd.inputPath);

  let valid = checker.isValidTaskProject(cmd.inputPath, manifest);
  if (valid.error) {
    loggerPackager.error(valid.error);
    return process.exit(1);
  }

  let outputPath = path.resolve(cmd.outputPath);

  logger.info('Packaging task: ' + color('green', `${manifest.fqtn}@${manifest.version}`));
  logger.info('Packaging to: ' + color('blueBright', outputPath));

  logger.info(' ');
  logger.info('Checking');
  let maxWidth = 0;
  for (let fname of INCLUDED_FILES) {
    let filePath = path.join(cmd.inputPath, fname);
    if (!fs.existsSync(filePath)) {
      logger.error('   ' + color('blueBright', filePath) + ' ' + color('red', 'FILE_MISSING'));

      return process.exit(1);
    }
    if (fname.length > maxWidth) {
      maxWidth = fname.length;
    }

    logging.info('   ' + color('green', '✔') + ' ' + color('blueBright', filePath));
  }

  logging.info(' ');
  logging.info('Zipping');

  let zip = new AdmZip();
  for (let fname of INCLUDED_FILES) {
    let filePath = path.join(cmd.inputPath, fname);
    let stats = fs.lstatSync(filePath);

    let namePadded = fname + ' '.repeat(maxWidth - fname.length);
    if (stats.isFile()) {
      let fileBuffer = fs.readFileSync(filePath);
      logger.info('   📄 ' + color('blueBright', namePadded) + ' ' + getByteSize(fileBuffer.byteLength));
      zip.addFile(fname, fileBuffer);
    } else {
      let files = fs.readdirSync(filePath);
      logger.info('   📁 ' + color('blueBright', namePadded));
      files.forEach((file) => {
        let fileBuffer = fs.readFileSync(path.join(filePath, file));
        let namePadded2 = file + ' '.repeat(maxWidth - file.length - 2);

        logger.info('     📄 ' + color('blueBright', namePadded2) + ' ' + getByteSize(fileBuffer.byteLength));
        zip.addFile(path.join(fname, file), fileBuffer);
      });
    }
  }

  let zipPath = path.join(outputPath, manifest.fqtn + '.zip');
  zip.writeZip(zipPath);

  let zipSize = zip.toBuffer().byteLength;
  logger.info(' ');
  logger.info('Total Packaged Size: ' + getByteSize(zipSize));


  logger.info(' ');
  logger.info('Package available at: ' + color('blueBright', zipPath));
  logger.info('Use (' + color('blackBright', 'rallf-js publish') + ') to publish it to rallf market');
});

program.parse(process.argv);