'use strict';

const rest = require('../../services/universal/rest');

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    locals.sectionFront = data.title;
  }
  return data;
};

module.exports.save = async (uri, data, locals) => {
  if (data.title) {
    /* @todo:
    /* fetch current data from https://www.radio.com/_lists/primary-section-fronts
    /* on publish add to lists, on unpublish remove */
    await rest.get(`${locals.site.protocol}://${locals.site.host}/_lists/primary-section-fronts`).then((primarySectionFronts)=>{

    })
  }
  return data;
};
