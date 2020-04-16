'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { isPresentationMode } = require('../../services/universal/contest-rules-page');

module.exports = unityComponent({
  render(ref, data, locals) {

    data._computed = {
      pageTitle: isPresentationMode(locals.url) ?
        'Contests' :
        'Contest Rules'
    };

    return data;
  }
});
