'use strict';

const { hypensToSpaces, titleCase } = require('../../services/universal/dynamic-route-param');

module.exports.render = (ref, data, locals) => {
  var param = locals && locals.params ? hypensToSpaces(locals.params[data.routeParam]) : '';

  data.title = data.dynamicTitle.replace('${routeParamValue}', titleCase(param));

  return data;
};
