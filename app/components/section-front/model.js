'use strict';

const db = require('../../services/server/db'),
  log = require('../../services/universal/log').setup({ file: __filename, component: 'section-front' }),
  primarySectionFrontsList = '/_lists/primary-section-fronts',
  { subscribe } = require('amphora-search');
  
subscribe('publishPage').through(publishPage);

function publishPage(stream) {
  stream
    .filter( filterNonSectionFront )
    .each( handlePublish );
}

function filterNonSectionFront(page) {
  return page.data && page.data.main && page.data.main[0].includes('/_components/section-front/instances/');
}

async function handlePublish(page) {
  try {
    const host = page.uri.split('/')[0],
      sectionFrontRef = page.data.main[0].replace('@published',''),
      data = await db.get(sectionFrontRef);
    
    if (data.title && !data.titleLocked) {
      const primarySectionFronts = await db.get(`${host}${primarySectionFrontsList}`),
        sectionFrontValues = primarySectionFronts.map(sectionFront => sectionFront.value);
      
      if (!sectionFrontValues.includes(data.title.toLowerCase())) {
        primarySectionFronts.push({
          name: data.title,
          value: data.title.toLowerCase()
        });
        await db.put(`${host}${primarySectionFrontsList}`, JSON.stringify(primarySectionFronts));
        await db.put(sectionFrontRef, JSON.stringify({...data, titleLocked: true}));
      }
    }
  } catch (e) {
    log('error', e);
  }
};

subscribe('unpublishPage').through(unpublishPage);

function unpublishPage(stream) {
  stream
    .each( handleUnpublish );
}
 
async function handleUnpublish(page) {
  try {
    const host = page.uri.split('/')[0],
      pageData = await db.get(page.uri),
      sectionFrontRef = pageData.main[0],
      data = await db.get(sectionFrontRef);

    if (data.title) {
      const primarySectionFronts = await db.get(`${host}${primarySectionFrontsList}`),
        updatedSectionFronts = primarySectionFronts.filter(sectionFront => {
          return sectionFront.value !== data.title.toLowerCase();
        });

      await db.put(`${host}${primarySectionFrontsList}`, JSON.stringify(updatedSectionFronts));
      await db.put(sectionFrontRef, JSON.stringify({...data, titleLocked: false}));
    }
  } catch (e) {
    log('error', e);
  }
};

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    locals.sectionFront = data.title.toLowerCase();
  }

  return data;
};
