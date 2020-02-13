'use strict';

module.exports.render = (ref, data, locals) => {
  const { radiumUser } = locals;

  data.radiumUser = radiumUser;
  if (radiumUser) {
    data.accountUser = radiumUser.first_name || 'My Account';
  }

  data.headerLinks = data.headerLinks.map((headerLink) => {
    headerLink.current = !!headerLink.url && locals.url.includes(headerLink.url);
    return headerLink;
  });
  return data;
};
