'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  url = require('url');

module.exports = unityComponent({
  render(ref, data, locals) {
    const { pathname } = url.parse(locals.url);

    data._computed = {
      pageTitle: pathname === '/contests' ?
        'Contests' :
        'Contest Rules'
    };

    return data;
  }
});
