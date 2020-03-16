'use strict';

const _set = require('lodash/set'),
  getNationalSubcriptions = require('../../get-national-subscriptions');

module.exports = router => {
  router.get('/*', async (req, res, next) => {

    if (res.locals.edit) {
      _set(res, 'locals.nationalSubscriptions', await getNationalSubcriptions());
    }

    next();
  });
};
