'use strict';

module.exports['1.0'] = (uri, data) => {
  return Object.assign(data, {
    defaultKilnTitle: data.kilnTitle,
    defaultOgTitle: data.ogTitle,
    defaultTitle: data.title,
    defaultTwitterTitle: data.twitterTitle
  });
};
