'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  _get = require('lodash/get'),
  qs = require('querystring'),
  { DEFAULT_RADIOCOM_LOGO } = require('../../services/universal/constants');

/**
 * Returns a query string with all that you provide or some defaults
 *
 * @param {object} params - object of parmas
 *
 * @returns {string}
 */
function getUtmTracking(params = {}) {
  return `?${qs.stringify({
    utm_campaign: params.utm_campaign || 'sharebutton',
    utm_medium: params.utm_medium || 'social',
    utm_term: params.utm_term || 'NATL-RC',
    ...params
  })}`;
}

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
    if (!locals || !locals.podcast) {
      return data;
    }

    data._computed.podcast = locals.podcast;
    // at this point it isn't clear how we will get the share and subscription info necessary to
    // create the view required by design therefore, to show the design and code for the future I am
    // creating two props _computed.shares and _computed.subscriptions that the model will have to compute like so:
    const computedPodcast = data._computed.podcast;

    data._computed.shares = [
      { name: 'email',
        link: `mailto:${getUtmTracking({
          subject: computedPodcast.attributes.title,
          body: `${locals.url}${getUtmTracking({
            utm_source: locals.site.host,
            utm_medium: 'email',
            utm_term: _get(locals, 'station.callsign')
          })}`
        })}`
      },
      { name: 'facebook',
        link: `http://www.facebook.com/sharer/sharer.php${getUtmTracking({
          u: locals.url,
          utm_source: 'facebook.com'
        })}`
      },
      { name: 'twitter',
        link: `https://twitter.com/share${getUtmTracking({
          text: computedPodcast.attributes.title,
          via: computedPodcast.attributes.twitterHandle | undefined,
          utm_source: 'twitter.com'
        })}`
      }
    ];
    /*
    * [ON-1683] Awaiting API to define subscriptions data to be able to display or hide subscription buttons.
    */
    /* data._computed.subscriptions = {
       google: 'https://google.com',
       apple: 'https://apple.com',
       rss: computedPodcast.attributes.rss_feed
    };*/
    data._computed.DEFAULT_RADIOCOM_LOGO = DEFAULT_RADIOCOM_LOGO;
    return data;
  }
});
