'use strict';

const util = require('util');
const fs = require('fs');

const TWELVE_HOURS_IN_MILLISECONDS = 12 * 60 * 60 * 1000;
const TTL = TWELVE_HOURS_IN_MILLISECONDS;

const getFileStats = path => util.promisify(fs.stat)(path);
const getFileText = path => util.promisify(fs.readFile)(path, 'utf-8');

/**
 * Queries the local `.aws_token` and sets the env variables onto process.env.
 * Will return the process.env object when complete (regardless of success, so check for values)
 * @returns {Promise<object>}
 */
async function setAwsTokens_v1() {
  try {
    const PATH = process.env.HOME + '/.aws_token';

    const { mtime } = await getFileStats(PATH);

    if(Date.now() - mtime > TTL) {
      console.log('AWS Token has expired, rerun \'token\' to activate.');
    } else {
      const text = await getFileText(PATH);

      Object.assign(process.env, text
        .replace(/\nexport/g, ' ')
        .replace(/(\n|export)/g, '')
        .trim()
        .split(/\s+/)
        .map(i => i.split('='))
        .reduce((acc, [key, value]) => ({...acc, [key]: value}), {}));
    }
  } catch (error) {
    if (error.message.startsWith('ENOENT')) {
      console.log('AWS Token does not exist. Run \'token\' to activate it.')
    } else {
      console.error(error.message)
    }
  }
  return process.env;
}

module.exports = {
  v1: setAwsTokens_v1
}
