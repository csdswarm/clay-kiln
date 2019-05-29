'use strict';

const db = require('../../services/server/db'),
  { addEventCallback } = require('../../services/universal/eventBus'),
  log = require('../../services/universal/log').setup({ file: __filename });

let primarySectionFrontsList,
  sectionFrontRef;

addEventCallback('clay:publishPage', async payload => {
  try {
    sectionFrontRef = JSON.parse(payload).data.main[0].replace('@published','');
    const data = await db.get(sectionFrontRef);

    if (data.title && !data.titleLocked) {
      const primarySectionFronts = await db.get(primarySectionFrontsList),
        sectionFrontValues = primarySectionFronts.map(sectionFront => sectionFront.value);

      if (!sectionFrontValues.includes(data.title.toLowerCase())) {
        primarySectionFronts.push({
          name: data.title,
          value: data.title.toLowerCase()
        });
        await db.put(primarySectionFrontsList, JSON.stringify(primarySectionFronts));
        await db.put(sectionFrontRef, JSON.stringify({...data, titleLocked: true}));
      }
    }
  } catch (e) {
    log('error', e);
  }
});

addEventCallback('clay:unpublishPage', async payload => {
  const pageData = await db.get(JSON.parse(payload).uri);

  try {
    sectionFrontRef = pageData.main[0];
    const data = await db.get(sectionFrontRef);

    if (data.title) {
      const primarySectionFronts = await db.get(primarySectionFrontsList),
        updatedSectionFronts = primarySectionFronts.filter(sectionFront => {
          return sectionFront.value !== data.title.toLowerCase();
        });

      await db.put(primarySectionFrontsList, JSON.stringify(updatedSectionFronts));
      await db.put(sectionFrontRef, JSON.stringify({...data, titleLocked: false}));
    }
  } catch (e) {
    log('error', e);
  }
});

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    locals.sectionFront = data.title.toLowerCase();
  }

  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';

  return data;
};

module.exports.save = (uri, data, locals) => {
  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';

  return data;
};
