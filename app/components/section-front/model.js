'use strict';

const db = require('../../services/server/db'),
  slugifyService = require('../../services/universal/slugify'),
  eventBusService = require('../../services/universal/eventBus');

let primarySectionFrontsList,
  sectionFrontRef;

/* @todo:
/* use event bus: on publish add to lists & lock title field,
/* on unpublish remove from list & unlock title field */

eventBusService.setEventCallback('clay:publishPage', async payload => {
  try {
    const data = await db.get(sectionFrontRef);

    console.log("publish page: ", data, sectionFrontRef, primarySectionFrontsList);
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
        console.log("updated list to add: ", data.title, data.titleLocked);
        // @todo: rerender kiln
      }
    }
  } catch(e) {
    console.log(e);
  }
});

eventBusService.setEventCallback('clay:unpublishPage', async payload => {
  try {
    const data = await db.get(sectionFrontRef);

    console.log("unpublish page: ", data, sectionFrontRef, primarySectionFrontsList);
    if (data.title) {
      const primarySectionFronts = await db.get(primarySectionFrontsList),
        updatedSectionFronts = primarySectionFronts.filter(sectionFront => {
          return sectionFront.value !== slugifyService(data.title);
        });

      await db.put(primarySectionFrontsList, JSON.stringify(updatedSectionFronts));
      data.titleLocked = false;
      await db.put(sectionFrontRef, JSON.stringify(data));
      console.log("updated list to remove: ", data.title, data.titleLocked);
      // @todo: rerender kiln
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
  primarySectionFrontsList = `${locals.site.host}/_lists/primary-section-fronts`;

  return data;
};

module.exports.save = (uri, data, locals) => {
  sectionFrontRef = uri.replace('@published','');
  primarySectionFrontsList = `${locals.site.host}/_lists/primary-section-fronts`;

  return data;
}
