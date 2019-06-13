'use strict';

const db = require('../../services/server/db'),
  log = require('../../services/universal/log').setup({ file: __filename, component: 'section-front' }),
  primarySectionFrontsList = '/_lists/primary-section-fronts',
  secondarySectionFrontsList = '/_lists/secondary-section-fronts',
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
      data = await db.get(sectionFrontRef),
      sectionFrontsList = data.primary ? primarySectionFrontsList : secondarySectionFrontsList;
    
    if (data.title && !data.titleLocked) {
      const sectionFronts = await db.get(`${host}${sectionFrontsList}`),
        sectionFrontValues = sectionFronts.map(sectionFront => sectionFront.value);
      
      if (!sectionFrontValues.includes(data.title.toLowerCase())) {
        sectionFronts.push({
          name: data.title,
          value: data.title.toLowerCase()
        });
        await db.put(`${host}${sectionFrontsList}`, JSON.stringify(sectionFronts));
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
      mainRef = pageData.main[0];

    if (mainRef.includes('/_components/section-front/instances/')) {
      const data = await db.get(mainRef),
        sectionFrontsList = data.primary ? primarySectionFrontsList : secondarySectionFrontsList;
      
      if (data.title) {
        const sectionFronts = await db.get(`${host}${sectionFrontsList}`),
          updatedSectionFronts = sectionFronts.filter(sectionFront => {
            return sectionFront.value !== data.title.toLowerCase();
          });

        await db.put(`${host}${sectionFrontsList}`, JSON.stringify(updatedSectionFronts));
        await db.put(mainRef, JSON.stringify({...data, titleLocked: false}));
      }
    }
  } catch (e) {
    log('error', e);
  }
};

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    if (data.primary) {
      locals.sectionFront = data.title.toLowerCase();
    } else {
      locals.sectionFront = data.primarySectionFront;
      locals.secondarySectionFront = data.title.toLowerCase();
    }
  }

  return data;
};
