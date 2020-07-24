'use strict';

let editorialGroups = null;
const rest = require('../universal/rest');

module.exports = async () => {
  // we set editorial group subscriptions once
  if (!editorialGroups) {
    editorialGroups = await rest.get(`${ process.env.CLAY_SITE_PROTOCOL }://${ process.env.CLAY_SITE_HOST }/rdc/editorial-group`);
  }

  return editorialGroups;
};
