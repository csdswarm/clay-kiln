'use strict';

const db = require('../../services/server/db'),
  slugifyService = require('../../services/universal/slugify'),
  { addEventCallback } = require('../../services/universal/eventBus');

let primary,
  primarySectionFrontsList,
  secondarySectionFrontsList,
  sectionFrontRef;

addEventCallback('clay:publishPage', async () => {
  try {
    const data = await db.get(sectionFrontRef),
      sectionFrontsList = primary ? primarySectionFrontsList : secondarySectionFrontsList;

    if (data.title && !data.titleLocked) {
      const sectionFronts = await db.get(sectionFrontsList),
        sectionFrontValues = sectionFronts.map(sectionFront => sectionFront.value);

      if (!sectionFrontValues.includes(slugifyService(data.title))) {
        sectionFronts.push({
          name: data.title,
          value: slugifyService(data.title)
        });
        await db.put(sectionFrontsList, JSON.stringify(sectionFronts));
        await db.put(sectionFrontRef, JSON.stringify({...data, titleLocked: true}));
      }
    }
  } catch (e) {
    console.log(e);
  }
});

addEventCallback('clay:unpublishPage', async () => {
  try {
    const data = await db.get(sectionFrontRef),
      sectionFrontsList = primary ? primarySectionFrontsList : secondarySectionFrontsList;

    if (data.title) {
      const sectionFronts = await db.get(sectionFrontsList),
        updatedSectionFronts = sectionFronts.filter(sectionFront => {
          return sectionFront.value !== slugifyService(data.title);
        });

      await db.put(sectionFrontsList, JSON.stringify(updatedSectionFronts));
      await db.put(sectionFrontRef, JSON.stringify({...data, titleLocked: false}));
    }
  } catch (e) {
    console.log(e);
  }
});

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    locals.sectionFront = data.title;
  }

  primary = data.primary;
  sectionFrontRef = uri.replace('@published','');
  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';
  secondarySectionFrontsList = locals ? `${locals.site.host}/_lists/secondary-section-fronts` : '';
  
  return data;
};

module.exports.save = (uri, data, locals) => {
  primary = data.primary;
  sectionFrontRef = uri.replace('@published','');
  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';
  secondarySectionFrontsList = locals ? `${locals.site.host}/_lists/secondary-section-fronts` : '';

  return data;
};
