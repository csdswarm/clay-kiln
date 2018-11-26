'use strict';

module.exports.render = (ref, data, locals) => {
  data.headerLinks = data.headerLinks.map((headerLink) => {
    if (locals.url.includes(headerLink.url)) {
      headerLink.current = true;
    }
    return headerLink;
  })
  return data;
};
