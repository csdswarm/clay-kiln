'use strict';

const rest = require('../universal/rest'),
  search = (req, res) => {
    console.log(req.query);
    res.send({...req.query, message: 'This is working'});
  },
  inject = (router) => {
    router.get('/brightcove/search', search);
  };

module.exports.inject = inject;
