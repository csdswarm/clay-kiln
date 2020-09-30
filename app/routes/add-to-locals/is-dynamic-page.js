
'use strict';

const db = require('../../services/server/db'),
  _ = require('lodash'),
  logger = require('../../services/universal/log'),
  log = logger.setup({ file: __filename });

module.exports = router => {

  router.get('/*', async (req, res, next) => {
    const { edit } = res.locals;

    try {
      if (edit) {
        const where = _.includes(req.uri, '_pages') ? `WHERE id = ${req.uri}` : `WHERE meta->>'url' = http://${req.uri}`,
          results = await db.raw(`
            WITH _page_main (main) AS (
              SELECT data->'main'->>0, position('/instances/' in data->'main'->>0)
              FROM pages
              ${where}
            )
        
            SELECT _pm.main, _p.data->>'_dynamic' AS dynamic
            FROM _page_main _pm, pages _p
            WHERE LEFT(_pm.main, _pm.position) || 'instances/new' = _p.data->'main'->>0
            AND _p.data->>'_dynamic' IS NOT NULL
          `);

        if (_.get(results, 'rows[0].dynamic')) {
          res.locals.isDynamicPage = true;
        };

      };
    } catch (error) {
      log('error', `Error setting isDynamicPage on locals for ${req.uri}: \n`, error);
    };

    next();
  });

};
