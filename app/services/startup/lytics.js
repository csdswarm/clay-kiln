'use strict';

const inject = app => {
  app.use((req, res, next) => {
    res.locals.lytics = {
      uid: req.cookies.seerid
    };

    next();
  });
};

module.exports.inject = inject;
