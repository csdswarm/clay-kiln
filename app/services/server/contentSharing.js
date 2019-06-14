'use strict';

const qs = require('qs'),
  rest = require('../universal/rest'),
  log = require('../universal/log').setup({ file: __filename }),
  importContentUrl = process.env.IMPORT_CONTENT_URL,
  importContent = async (req, res) => {
    try {
      if (!req.user || !req.user.auth) {
        res.status(401).send('You are not authorized to perform this action');
      }

      const params = qs.stringify({...req.body, publish: false}),
        {results} = await rest.get(`${importContentUrl}?${params}`);

      res.send(results);
    } catch (e) {
      log('error', e);
      res.status(500).send('There was an error importing this content');
    }
  };

module.exports = importContent;
