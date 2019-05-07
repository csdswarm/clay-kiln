'use strict';

const db = require('../../services/server/db'),
  slugifyService = require('../../services/universal/slugify');

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    locals.sectionFront = data.title;
  }
  return data;
};

module.exports.save = async (uri, data, locals) => {
  /* @todo:
  /* use event bus: on publish add to lists & lock title field, on unpublish remove from list */
  if (data.title && !data.titleLocked) {
    const primarySectionFrontsList = `${locals.site.host}/_lists/primary-section-fronts`;
    await db.get(primarySectionFrontsList).then(async primarySectionFronts => {
      const sectionFrontValues = primarySectionFronts.map(sectionFront => sectionFront.value);

      if (!sectionFrontValues.includes(slugifyService(data.title))) {
        primarySectionFronts.push({
          name: data.title,
          value: slugifyService(data.title)
        });
        try {
          console.log("update list", data.title, data.titleLocked);
          return await db.put(primarySectionFrontsList, JSON.stringify(primarySectionFronts)).then(response => {
            data.titleLocked = true;
            console.log("updated", data);
            return data;
          });
        } catch(e) {
          throw e;
        };
      }
    }).catch(e => console.log(e));
  }

  console.log("data on save: ", data);
  return data;
};
