'use strict';
const url = require('url');

module.exports.render = async (uri, data, locals) => {
  if (locals.params) {
    if (locals.params.dynamicGenre) {
      // for use in template to fix issue with locals.params not updating in template after spa routing
      data.dynamicGenre = locals.params.dynamicGenre;
    }
  }
  if (locals.url.includes('stations/news-talk') || locals.url.includes('stations/sports')) {
    data.dynamicGenre = locals.params.dynamicGenre = url.parse(locals.url).pathname.split('stations/')[1];
  }

  // this should be updated to use _computed once that's in (ON-1021)
  data.allMusic = locals.allMusic;
  data.allNewsTalk = locals.allNewsTalk;
  data.allMarkets = locals.allMarkets;

  return data;
};
