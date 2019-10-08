'use strict';

const mockData = {
  rules: new Array(5).fill(0).map(() => ({
    title: 'Rule title',
    description: 'Lorem ipsum dolor sit amet consectetur',
    date: new Date().toISOString()
  }))
};

module.exports.render = (ref, data, locals) => {
  console.log('[CONTEST RULES RENDER]', locals.params.stationSlug);
  return Object.assign(data, {
    contestRules: mockData.rules
  });
};
