'use strict';

const db = require('../../services/server/db'),
  slugifyService = require('../../services/universal/slugify'),
  { addEventCallback } = require('../../services/universal/eventBus');

let primarySectionFrontsList,
  sectionFrontRef;

addEventCallback('clay:publishPage', async () => {
  try {
    const data = await db.get(sectionFrontRef);

    if (data.title && !data.titleLocked) {
      const primarySectionFronts = await db.get(primarySectionFrontsList),
        sectionFrontValues = primarySectionFronts.map(sectionFront => sectionFront.value);

      if (!sectionFrontValues.includes(slugifyService(data.title))) {
        primarySectionFronts.push({
          name: data.title,
          value: slugifyService(data.title)
        });
        await db.put(primarySectionFrontsList, JSON.stringify(primarySectionFronts));
        data.titleLocked = true;
        await db.put(sectionFrontRef, JSON.stringify(data));
      }
    }
  } catch (e) {
    console.log(e);
  }
});

addEventCallback('clay:unpublishPage', async () => {
  try {
    const data = await db.get(sectionFrontRef);

    if (data.title) {
      const primarySectionFronts = await db.get(primarySectionFrontsList),
        updatedSectionFronts = primarySectionFronts.filter(sectionFront => {
          return sectionFront.value !== slugifyService(data.title);
        });

      await db.put(primarySectionFrontsList, JSON.stringify(updatedSectionFronts));
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

  return data;
};

module.exports.save = (uri, data, locals) => {
  sectionFrontRef = uri.replace('@published','');
  primarySectionFrontsList = locals ? `${locals.site.host}/_lists/primary-section-fronts` : '';

  return data;
};
