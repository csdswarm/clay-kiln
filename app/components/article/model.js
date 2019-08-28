'use strict';

const createContent = require('../../services/universal/create-content'),
  {autoLink} = require('../breadcrumbs'),
  urlExists = require('../../services/universal/url-exists');

module.exports.render = function (ref, data, locals) {
  autoLink(data, ['sectionFront', 'secondarySectionFront'], locals.site.host);
  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  const isClient = typeof window !== 'undefined';

  return isClient
    // This function requires `locals` parameter, which is only available on the client side
    ? urlExists(uri, data, locals)
      .then(urlAlreadyExists => {
        /*
          kiln doesn't display custom error messages, so on the client-side we'll
          use the publishing drawer for validation errors.
        */
        if (urlAlreadyExists && !isClient) {
          throw new Error('duplicate url');
        }

        return createContent.save(uri, data, locals);
      })
    : createContent.save(uri, data, locals);
};
