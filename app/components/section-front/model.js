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

      if (!sectionFrontValues.includes(data.title)) {
        primarySectionFronts.push({
          name: data.title,
          value: data.title
        });
        await db.put(primarySectionFrontsList, JSON.stringify(primarySectionFronts));
        await db.put(sectionFrontRef, JSON.stringify({...data, titleLocked: true}));
      }
    }
  } catch (e) {
    log('error', e);
  }
});

addEventCallback('clay:unpublishPage', async () => {
  try {
    const data = await db.get(sectionFrontRef);

    if (data.title) {
      const primarySectionFronts = await db.get(primarySectionFrontsList),
        updatedSectionFronts = primarySectionFronts.filter(sectionFront => {
          return sectionFront.value !== data.title;
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
    locals.sectionFront = data.title;
  }

  sectionFrontRef = uri.replace('@published','');
  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';

  return data;
};

module.exports.save = (uri, data, locals) => {
  sectionFrontRef = uri.replace('@published','');
  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';

  return data;
};
