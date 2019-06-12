'use strict';

const qs = require('qs'),
  rest = require('../universal/rest'),
  log = require('../universal/log').setup({ file: __filename }),
  importContentUrl = 'https://ztgezbix26.execute-api.us-east-1.amazonaws.com/Stage/import-content',
  importContent = async (req, res) => {
    console.log('body', req.body);
    try {
      // Need to pass in req.body instead
      const params = qs.stringify({filter: {id: 3251}, publish: false}),
        {results} = await rest.get(`${importContentUrl}?${params}`);

      res.send(results);
    } catch (e) {
      log('error', e);
      res.status(500).send('There was an error importing this content');
    }
  };

module.exports.inject = (app) => {
  app.post('/import-content', importContent);
};
