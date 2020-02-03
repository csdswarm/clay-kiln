'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  rest = require('../../services/universal/rest'),
  _get = require('lodash/get');

module.exports = unityComponent({
  /**
   * Updates the data for the template prior to render
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  render: (uri, data, locals) => {
    // NOTE: this is just for testing purposes and should be removed upon integration with page
    // in fact there shouldn't even be a model.js as this component will be a partial
    const
      id = _get(locals, 'query.id', [8,11,13,14,160,162,165].sort(() => Math.random() < 0.5 ? 1 : -1)[0]);

    console.log('locals.query.id'. id);
    return rest.get(`https://api.radio.com/v1/podcasts/${id}`)
      .then(response => {
        data._computed.podcast = response.data;
        data._computed.podcast.attributes.shares = ['facebook', 'twitter', 'email'];
        return data;
      })
      .catch( () => data);
  },

  /**
   * Makes any necessary modifications to data just prior to persisting it
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  save: (uri, data) => {
    return data;
  }
});
