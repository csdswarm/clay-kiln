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

async function addComponentToArticleData(articleInstanceData, componentName){
  const newData = {_ref: `${hostUrl}/_components/${componentName}/instances/default`};
  const target = articleInstanceData._layouts['two-column-layout'].instances.article.top;
  const sliderIndex = target.findIndex((el) => hostUrl + el._ref === newData._ref);
  // remove the slider if it is there
  if(sliderIndex > -1) {
    target.splice(sliderIndex, 1);
  }
  // now find the index of the nav ref
  const navIndex = target.findIndex((el) => hostUrl + el._ref === `${hostUrl}/_components/top-nav/instances/default`);
  // now insert it after the nav + 1
  target.splice(navIndex + 1, 0, newData);

  return articleInstanceData;
}

function getLayoutInstance(){
  return clayExport({componentUrl: `${hostUrl}/_layouts/two-column-layout/instances/article`});
}

function importContent(payload) {
  return clayImport({ payload, hostUrl: hostUrl, publish: true });
}

createDefaultInstance('latest-top-recirc-slider')
  .then( response => {
    console.log('[createDefaultInstance]', `${response} -- created\n==> now getting article layout instance...`);
    return getLayoutInstance()
  })
  .then( exportResponse => {
    console.log('[article layout instance retrieved] ===>');
    // console.log('[exportData.data]', exportResponse.data);
    console.log('==> now adding new ref into instance', );
    return addComponentToArticleData(exportResponse.data, 'latest-top-recirc-slider');
  })
  .then( newInstanceData => {
    console.log('[new reference added]');
    console.log('[newInstanceData]', newInstanceData._layouts['two-column-layout'].instances.article.top);
    console.log('==> now importing...');
    return importContent(newInstanceData);
  })
  .then( importResponse => {
    console.log('[importResponse]', importResponse);
  })
  .catch(console.log);
  