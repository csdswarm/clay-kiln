'use strict';

module.exports.render = (ref, data, locals) => {
  data.headerLinks = data.headerLinks.map((headerLink) => {
    headerLink.current = locals.url.includes(headerLink.url);
    return headerLink;
  });
  return data;
};
