'use strict';

const db = require('../../services/server/db'),
  slugifyService = require('../../services/universal/slugify'),
  eventBusService = require('../../services/universal/eventBus');

let primarySectionFrontsList,
  secondarySectionFrontsList,
  sectionFrontRef;

eventBusService.setEventCallback('clay:publishPage', async () => {
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
        data.titleLocked = true;
        await db.put(sectionFrontRef, JSON.stringify(data));
      }
    }
  } catch (e) {
    console.log(e);
  }
});

eventBusService.setEventCallback('clay:unpublishPage', async () => {
  try {
    const data = await db.get(sectionFrontRef),
      sectionFrontsList = primary ? primarySectionFrontsList : secondarySectionFrontsList;

    if (data.title) {
      const sectionFronts = await db.get(sectionFrontsList),
        updatedSectionFronts = sectionFronts.filter(sectionFront => {
          return sectionFront.value !== slugifyService(data.title);
        });

      await db.put(sectionFrontsList, JSON.stringify(updatedSectionFronts));
      data.titleLocked = false;
      await db.put(sectionFrontRef, JSON.stringify(data));
    }
  } catch (e) {
    console.log(e);
  }
});

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    locals.sectionFront = data.title;
  }

  sectionFrontRef = uri.replace('@published','');
  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';
  secondarySectionFrontsList = locals ? `${locals.site.host}/_lists/secondary-section-fronts` : '';

  return data;
};

module.exports.save = (uri, data, locals) => {
  sectionFrontRef = uri.replace('@published','');
  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';
  secondarySectionFrontsList = locals ? `${locals.site.host}/_lists/secondary-section-fronts` : '';

  return data;
};
