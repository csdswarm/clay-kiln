'use strict';

const db = require('../../services/server/db'),
  { addEventCallback } = require('../../services/universal/eventBus'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  primarySectionFrontsList = '/_lists/primary-section-fronts',
  secondarySectionFrontsList = '/_lists/secondary-section-fronts';

addEventCallback('clay:publishPage', async payload => {
  try {
    const host = JSON.parse(payload).uri.split('/')[0],
      sectionFrontRef = JSON.parse(payload).data.main[0].replace('@published',''),
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
});

addEventCallback('clay:unpublishPage', async payload => {
  try {
    const host = JSON.parse(payload).uri.split('/')[0],
      pageData = await db.get(JSON.parse(payload).uri),
      sectionFrontRef = pageData.main[0],
      data = await db.get(sectionFrontRef),
      sectionFrontsList = data.primary ? primarySectionFrontsList : secondarySectionFrontsList;

    if (data.title) {
      const sectionFronts = await db.get(`${host}${sectionFrontsList}`),
        updatedSectionFronts = sectionFronts.filter(sectionFront => {
          return sectionFront.value !== data.title.toLowerCase();
        });

      await db.put(`${host}${sectionFrontsList}`, JSON.stringify(updatedSectionFronts));
      await db.put(sectionFrontRef, JSON.stringify({...data, titleLocked: false}));
    }
  } catch (e) {
    log('error', e);
  }
});

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    if (data.primary) {
      locals.sectionFront = data.title.toLowerCase();
    } else {
      locals.secondarySectionFront = data.title.toLowerCase();
    }
  }

  return data;
}
