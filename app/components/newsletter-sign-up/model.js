'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  _get = require('lodash/get'),
  axios = require('axios'),
  cheerio = require('cheerio'),
  logger = require('../../services/universal/log'),
  log = logger.setup({ file: __filename });

module.exports = unityComponent({
  /**
   * Updates the data for the template prior to render
   * small proxy to the postup page because the client cannot access for details
   * in client.js
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  render: (uri, data, locals) => {

    if (!_get(locals, 'postup')) {
      return data;
    }

    if (_get(locals, 'postup')) {
      const params = {
        action: 'easySignup',
        ...locals.postup,
        importTemplateID: data.postUpImportTemplateId
      };

      if (data.postUpSiteID) {
        params.siteId = data.postUpSiteID;
      }

      return axios({
        method: 'post',
        url: 'http://www.e.radio.com/Subscribe.do',
        params
      })
        .then(r => {
          if (r.data.includes('success')) {
            return { success: true };
          } else {
            const $ = cheerio.load(r.data),
              errors = [];

            $('li.error').each((i,el) => errors.push($(el).text()));
            errors.forEach(err => {
              log('error', new Error(err), params);
            });
            return { success: false, params, errors };
          }
        })
        .catch(err => {
          log(err);
          return { success: false, params, errors: [err] };
        });
    }
  }
});
