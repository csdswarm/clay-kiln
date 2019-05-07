'use strict';

const db = require('../../services/server/db'),
  slugifyService = require('../../services/universal/slugify');

module.exports.render = async (uri, data, locals) => {
  if (data.title) {
    locals.sectionFront = data.title;
  }
  return data;
};

module.exports.save = async (uri, data, locals) => {
  /* @todo:
  /* use event bus: on publish add to lists & lock title field, on unpublish remove from list */
  if (data.title) {
    const primarySectionFrontsList = `${locals.site.host}/_lists/primary-section-fronts`;
    await db.get(primarySectionFrontsList).then(primarySectionFronts => {
      const sectionFrontNames = primarySectionFronts.map(sectionFront => sectionFront.name);

      if (!sectionFrontNames.includes(data.title)) {
        primarySectionFronts.push({
          name: data.title,
          value: slugifyService(data.title)
        });
        console.log(primarySectionFronts);
        try {
          db.put(primarySectionFrontsList, JSON.stringify(primarySectionFronts));
        } catch(e) {
          throw e;
        };
      }
    }).catch(e => console.log(e));
  }

  return data;
};
