'use strict';

module.exports.render = async (uri, data, locals) => {
  if (locals.params) {
    if (locals.params.dynamicMarket) {
      // for use in template to fix issue with locals.params not updating in template after spa routing
      data.market = locals.params.dynamicMarket;
    }
  }

  // this should be updated to use _computed once that's in (ON-1021)
  data.allMarkets = locals.allMarkets;

  return data;
};
