'use strict';

const db = require('../../services/server/db'),
  { addEventCallback } = require('../../services/universal/eventBus'),
  log = require('../../services/universal/log').setup({ file: __filename });

let primary,
  primarySectionFrontsList,
  secondarySectionFrontsList,
  sectionFrontRef;

addEventCallback('clay:publishPage', async payload => {
  try {
    sectionFrontRef = JSON.parse(payload).data.main[0].replace('@published','');
    const data = await db.get(sectionFrontRef),
      sectionFrontsList = primary ? primarySectionFrontsList : secondarySectionFrontsList;

    if (data.title && !data.titleLocked) {
      const sectionFronts = await db.get(sectionFrontsList),
        sectionFrontValues = sectionFronts.map(sectionFront => sectionFront.value);

      if (!sectionFrontValues.includes(data.title.toLowerCase())) {
        sectionFronts.push({
          name: data.title,
          value: data.title.toLowerCase()
        });
        await db.put(sectionFrontsList, JSON.stringify(sectionFronts));
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
    const data = await db.get(sectionFrontRef),
      sectionFrontsList = primary ? primarySectionFrontsList : secondarySectionFrontsList;

    if (data.title) {
      const sectionFronts = await db.get(sectionFrontsList),
        updatedSectionFronts = sectionFronts.filter(sectionFront => {
          return sectionFront.value !== data.title.toLowerCase();
        });

      await db.put(sectionFrontsList, JSON.stringify(updatedSectionFronts));
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

  primary = data.primary;
  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';
  secondarySectionFrontsList = locals ? `${locals.site.host}/_lists/secondary-section-fronts` : '';
  
  return data;
};

module.exports.save = (uri, data, locals) => {
  primary = data.primary;
  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';
  secondarySectionFrontsList = locals ? `${locals.site.host}/_lists/secondary-section-fronts` : '';

  return data;
};
