const { clayImport, clayExport, readFile, prettyJSON, _has, _set } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';
const logMessage = message => data => {
  console.log(message + '\n\n');
  return data
};


async function createDefaultInstance(componentName) {
  try {
    const { data } = await readFile({ path: `./${componentName}.yml` });
    await clayImport({
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
  articleInstanceData['top'].push({_ref: `${hostUrl}/_components/${componentName}/instances/default`});
  return articleInstanceData;
}

function getLayoutInstance(){
  return clayExport({componentUrl: `${hostUrl}/_layouts/two-column-layout/instances/article`});
}

function importContent(contentData) {
  return clayImport({ payload: contentData, hostUrl: `${hostUrl}/_layouts/two-column-layout/instances/article`, publish: true });
}

createDefaultInstance('latest-top-recirc-slider')
  // first create the default instance
  .then( componentName => logMessage(`Default ${componentName} instance created.`)())
  // next get the layout instance data
  .then(getLayoutInstance)
  // next push the new ref on to the layout instance
  .then( ({data}) => addComponentToArticleData(data._layouts['two-column-layout'].instances.article, 'latest-top-recirc-slider'))
  .then( articleInstanceData => logMessage(prettyJSON(articleInstanceData))())
  // .then( (data) => importContent(data))
  // .then( r => console.log('[rrr]', r))
  .catch(console.log);



  // getLayoutInstance()
//   .then( ({data}) => {
//     // console.log('[response data]', data._layouts['two-column-layout'].instances.article);
//     console.log('[addComponentToArticle]', addComponentToArticle(data._layouts['two-column-layout'].instances.article, 'latest-top-recirc-slider'));
//     // console.log('[addComponentToLayouts]', addComponentToLayouts(li, 'latest-top-recirc-slider'));
//   });



// createDefaultAlertBanner()
//   .then(logMessage('Default alert-banner instance created.'))
//   .then(() => Promise.all([getLayoutInstances(), getPages()]))
//   .then(logMessage('Got layout instances and pages.'))
//   .then(([layouts, pages]) => Promise.all([addBannerToLayouts(layouts), addBannerToPages(pages)]))
//   .then(logMessage('Added banner to layout instances and pages.'))
//   .then(([layouts, pages]) => importContent([...layouts, ...pages]))
//   .then(logMessage('Done.'))
//   .catch(console.log);