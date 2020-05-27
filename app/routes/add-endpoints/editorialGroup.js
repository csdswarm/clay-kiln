'use strict';

const { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  _isEmpty = require('lodash/isEmpty'),
  db = require('../../services/server/db'),
  getEditorialGroups = require('../../services/server/get-editorial-groups');

module.exports = router => {
  router.get('/rdc/editorial-group', wrapInTryCatch(async (req, res) => {
    const result = await getEditorialGroups();
    
    if (!result) {
      res.status(404).end();
      return;
    }
    res.send(result);
  }));
  
  router.put('/rdc/editorial-group/:id', wrapInTryCatch(async (req, res) => {
    const { body, params } = req;
    
    if (_isEmpty(body) && _isEmpty(params)) {
      return res.status(400).send('a request body is required');
    }
    await db.raw('UPDATE editorial_group SET data = ? WHERE id = ?' , [body, params.id]);
    
    res.send(body);
  }));
};
