'use strict';

const { isPage, isComponent } = require('clayutils'),
  log = require('../../services/universal/log').setup({
    file: __filename,
    component: 'newsfeed'
  });

module.exports.render = (ref, data, locals) => {
  const reqUrl = locals.url;

  log('debug', 'request URL', {
    hits: reqUrl,
    ref
  });

  // If we're publishing for a dynamic page, rendering a component directly
  // or trying to render a page route we need a quick return
  if (locals.isDynamicPublishUrl || isComponent(reqUrl) || isPage(reqUrl)) {
    return data;
  }

  data.dynamicTag = locals && locals.params ? locals.params.tag : '';
  return data;
};

module.exports.save = function (ref, data) {
  // make sure all of the numbers we need to save aren't strings
  if (data.size) {
    data.size = parseInt(data.size, 10);
  }

  return data;
};
