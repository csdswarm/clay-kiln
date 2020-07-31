'use strict';

const log = require('../../services/universal/log').setup({ file: __filename }),
  { getPodcastEpisode, getPodcastShow } = require('../../services/server/podcast');

module.exports = (router) => {
  router.get('/rdc/api/podcast', async (req, res) => {
    const { dynamicSlug } = req.params,
      { locals } = res.locals;

    try {
      res.send(await getPodcastShow(locals, dynamicSlug));
    } catch (err) {
      log('error', 'podcast-show api error', err);
      res.status(500)
        .send('issue retrieving podcast-show');
    }
  }),

  router.get('/rdc/api/episode', async (req, res) => {
    const { dynamicEpisode } = req.params,
      { locals } = res.locals;

    try {
      res.send(await getPodcastEpisode(locals, dynamicEpisode));
    } catch (err) {
      log('error', 'podcast-episode api error');
      res.status(500)
        .send('issue retrieving podcast-episode');
    }
  });

  return router;
};
