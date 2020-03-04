'use strict'

module.exports = plop => {

  require('./_helpers/index')(plop);
  require('./_partials/index')(plop);
  require('./_prompts/index')(plop);
  require('./_actions/index')(plop);

  // generators:

  require('./component')(plop);
  require('./create')(plop);

  // end generators:
}
