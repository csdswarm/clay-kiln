'use strict';

const { getPageInstance, isPageMeta } = require('clayutils'),
  getPageTemplateIds = require('../../get-page-template-ids'),
  { anyStation } = require('../../../universal/user-permissions');

module.exports = router => {
  router.get('/_pages/*', async (req, res, next) => {
    const {
      edit: isRequestingEditMode,
      user
    } = res.locals;

    if (
      !isPageMeta(req.uri)
      && isRequestingEditMode
      // we test against any station because this is not a
      //   station-specific permission
      && !user.can('update').a('pageTemplate').for(anyStation).value
    ) {
      const pageInstance = getPageInstance(req.uri),
        pageTemplateIds = await getPageTemplateIds(res.locals);

      if (pageTemplateIds.has(pageInstance)) {
        res.status(403);
        res.send({ error: 'Permission Denied' });
        return;
      }
    }

    next();
  });
};
