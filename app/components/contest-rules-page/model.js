'use strict';
/* eslint-disable one-var */

const mockData = {
  rules: new Array(5).fill(0).map(() => ({
    title: 'Rule title',
    description: 'Lorem ipsum dolor sit amet consectetur',
    date: new Date().toISOString(),
    url: 'http://clay.radio.com',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris convallis pulvinar odio, et pellentesque urna interdum vitae. Sed porta, magna sed tincidunt dignissim, dui mi vulputate dui, id rutrum nulla sem in magna. Vestibulum tincidunt ante neque, at finibus elit aliquet ac. Cras enim enim, accumsan in blandit in, bibendum maximus risus. Quisque lacinia sapien ac magna fringilla porta. Nunc sed est in sapien fermentum scelerisque ultrices ac mi. Integer sed feugiat metus.'
  }))
};

module.exports.render = (ref, data, locals) => {
  const {
    params = {
      stationSlug: ''
    }
  } = locals;
  const { stationSlug = '' } = params;
  const hasStation = !!stationSlug;

  console.log('[CONTEST RULES RENDER]', stationSlug);
  return Object.assign(data, {
    contestRules: mockData.rules,
    hasStation
  });
};
