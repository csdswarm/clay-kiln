const { clayImport, clayExport, readFile, prettyJSON, _has, _set } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';
const logMessage = message => data => {
  console.log(message + '\n\n');
  return data
};

async function createDefaultInstance(componentName) {
    try {
      const { data } = await readFile({ path: `./${componentName}.yml` });
      const stuff = await clayImport({
        hostUrl,
        payload: data
      });
    } catch (error) {
      console.log(`An error occurred while trying to create the default ${componentName} instance.`, prettyJSON({err}));
      throw error;
    }
    return componentName;
  }

  createDefaultInstance('contest-rules')
  .then( response => {
    console.log('[createDefaultInstance]', `${response} -- created`);
  })
  .catch(console.log);