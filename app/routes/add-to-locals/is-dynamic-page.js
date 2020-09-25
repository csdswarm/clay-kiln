
'use strict';

const db = require('../../services/server/db'),
  _ = require('lodash');

module.exports = router => {

  router.get('/*', async (req, res, next) => {
    const { edit } = res.locals;

    try {
      if (edit) {
        const where = _.includes(req.uri, '_pages') ? 'WHERE id =' : "WHERE meta->>'url' ~",
          isDynamic = await db.raw(`
            WITH _page_main (main) AS (
              SELECT data->'main'->>0, position('/instances/' in data->'main'->>0)
              FROM pages
              ${where} '${req.uri}'
            )
        
            SELECT _p.data->>'_dynamic' AS dynamic
            FROM _page_main _pm, pages _p
            WHERE LEFT(_pm.main, _pm.position) || 'instances/new' = _p.data->'main'->>0
            AND _p.data->>'_dynamic' IS NOT NULL
          `);

        if (_.get(isDynamic, 'rows[0].dynamic')) {
          res.locals.isDynamicPage = true;
        };

      };
    } catch (error) {
      console.log(`Error setting isDynamicPage on locals for ${req.uri}: \n`, error);
    };

    next();
  });

};
