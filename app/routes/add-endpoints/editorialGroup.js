'use strict';
const { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  _isEmpty = require('lodash/isEmpty'),
  db = require('../../services/server/db');

module.exports = router => {
  router.get('/editorial-group', wrapInTryCatch(async (req, res, next) => {

    const result = await db.raw(`
    SELECT data
    FROM editorial_group
    WHERE id = ${req.query.id}
    `);
    
    if (!result.rows[0]) {
      return next();
    }
    
    res.send(result.rows[0].data);
  }));
  
  router.put('/editorial-group/:id', wrapInTryCatch(async (req, res) => {
    const { body, query } = req;
    
    if (_isEmpty(body) && _isEmpty(query)) {
      return res.send('There is no data');
    }
    const result = await db.raw('UPDATE editorial_group SET data = ? WHERE id = ?' , [body, query.id]);
    
    res.send('Record updated', result);
  }));
};
