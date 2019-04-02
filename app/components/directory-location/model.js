'use strict';

module.exports.render = async (uri, data, locals) => {
  if (locals.params) {
    if (locals.params.dynamicMarket) {
      // for use in template to fix issue with locals.params not updating in template after spa routing
      data.market = locals.params.dynamicMarket;
    }
  }
  return data;
};
