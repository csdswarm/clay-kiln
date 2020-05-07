'use strict'

module.exports = plop => {

  require('./_helpers')(plop);
  require('./_partials')(plop);
  require('./_prompts')(plop);
  require('./_actions')(plop);

  // generators:

  require('./component')(plop);
  require('./create')(plop);

  // end generators:
}
