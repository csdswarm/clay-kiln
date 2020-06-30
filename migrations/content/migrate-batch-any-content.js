'use strict';

/** 
 * Takes list of page uris (no @published urls) from one env and imports to another env
 * Usage: node migrate-batch-any-content in.txt preprod-clay.radio.com www.radio.com > portUpdatedLogs.txt
*/
const { v1: { readFileAsync } } = require('../utils/read-file'),
  { bluebird, _ } = require('../utils/base'),
  { v1: parseHost } = require('../utils/parse-host'),
  clayExport = require('../utils/clay-export').v1,
  clayImport = require('../utils/clay-import').v1,
  inputFile = process.argv.slice(2)[0],
  fromEnv = process.argv.slice(3)[0],
  toEnv = process.argv.slice(4)[0],
  fromEnvHttp = parseHost(fromEnv).http,
  toEnvHttp = parseHost(toEnv).http;
  

run()

async function run() {
  // Check for input file
  if (!inputFile) {
    console.error('Error: Missing input file path');
    process.exit(1);
  }
  // Check for starting environment
  if (!fromEnv) {
    console.error('Error: Missing environment to pull content from');
    process.exit(1);
  }
  // Check for ending environment
  if (!toEnv) {
    console.error('Error: Missing environment to push content to');
    process.exit(1);
  }

  const replaceHostDeep = object => {
    const newObject = _.clone(object);

    _.each(object, (value, key) => {
      if (typeof value === 'string' && value.includes(fromEnv)) {
        newObject[key] = value.replace(new RegExp(`${fromEnvHttp}://${fromEnv}`, 'g'), `${toEnvHttp}://${toEnv}`);
      } else if (typeof value === 'object') {
        newObject[key] = replaceHostDeep(value);
      }
    });

    return newObject;
  };

  const importURL = async (url, numTried = 0, maxTries = 3) => {
    return clayExport({ componentUrl: url })
      .then(exportedPage => replaceHostDeep(exportedPage.data))
      .then(pageData => {
        return clayImport({
          payload: pageData,
          hostUrl: `${toEnvHttp}://${toEnv}`,
          publish: true
        })
          .then(importResult => importResult)
          .catch(async e => {
            const updatedNumTried = numTried + 1;
            const limiter = 100;
            
            await new Promise(resolve => setTimeout(resolve, limiter));
            
            if (updatedNumTried < maxTries) {
              return importURL(url, updatedNumTried, maxTries);
            }
            
            console.error('Failed to import:', url, e);
            return null;
          });
      });
  }

  const fileContent = await readFileAsync(`${__dirname}/${inputFile}`, 'utf8'),
    urls = fileContent.split('\n');

  await bluebird.map(
    urls,
    async url => await importURL(url),
    { concurrency: 10 }
  );

}