'use strict';

const rest = require('../universal/rest'),
  search = (req, res) => {
    console.log(req.query);
    const results = ['something new', 'something else new', 'another new'];

    res.send(results);
  },
  inject = (router) => {
    router.get('/brightcove/search', search);
  };

module.exports.inject = inject;
