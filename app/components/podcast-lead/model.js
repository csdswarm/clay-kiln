'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  { playingClass } = require('../../services/universal/spaLocals'),
  _get = require('lodash/get'),
  qs = require('querystring'),
  format = require('date-fns/format'),
  parse = require('date-fns/parse'),
  addSeconds = require('date-fns/add_seconds'),
  { DEFAULT_RADIOCOM_LOGO, DEFAULT_STATION } = require('../../services/universal/constants'),
  { utils } = require('../../services/client/utils');

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
    utm_source: params.utm_source || '',
    utm_term: params.utm_term || DEFAULT_STATION.callsign,
    ...params
  })}`;
}

/**
 * returns a format string to be used with date fns
 *
 * @param {string} durationInSeconds - the duration in second from the api
 *
 * @returns {string}
 */
function getDurationFormat(durationInSeconds) {
  if (durationInSeconds < 60) {
    return 's [s]ec';
  }
  if (durationInSeconds >= 3660) {
    return 'H [h]r m [m]in';
  }
  if (durationInSeconds < 3660 && durationInSeconds >= 3600) {
    return 'H [h]r';
  }
  return 'm [m]in';
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

    const podcastData = _get(locals, 'podcast.attributes');

    podcastData.id = locals.podcast.id;

    let episodeData;

    if (locals.episode) {
      episodeData = _get(locals, 'episode.attributes');
      episodeData.id = locals.episode.id;
      episodeData.playingClass = playingClass(locals, episodeData.id);
    }

    data._computed.episode = episodeData;
    data._computed.podcast = podcastData;

    data._computed.category = _get(podcastData, 'category.0.name');
    data._computed.title = podcastData.title;
    data._computed.description = utils.stripHtml(podcastData.description);
    data._computed.imageURL = podcastData.image;

    if (episodeData) {
      data._computed.imageURL = episodeData.image_url;
      data._computed.title = episodeData.title;
      data._computed.episodeListURL = locals.url.replace(`/${episodeData.site_slug}`, '');
      data._computed.description = utils.stripHtml(episodeData.description);

      const startOfDay = new Date(0),
        durationInSeconds = parseFloat(episodeData.duration_seconds);

      data._computed.duration_seconds_formatted = format(
        addSeconds(startOfDay, durationInSeconds),
        getDurationFormat(durationInSeconds)
      );

      data._computed.published_date_formatted = format(
        parse(episodeData.published_date), 'MMMM DD, YYYY'
      );
    }

    // at this point it isn't clear how we will get the share and subscription info necessary to
    // create the view required by design therefore, to show the design and code for the future I am
    // creating two props _computed.shares and _computed.subscriptions that the model will have to compute like so:
    data._computed.shares = {
      email: {
        name: 'email',
        link: `mailto:${getUtmTracking({
          subject: episodeData ? episodeData.title : podcastData.title,
          body: `${locals.url}${getUtmTracking({
            utm_source: locals.site.host,
            utm_medium: 'email',
            utm_term: _get(locals, 'station.callsign')
          })}`
        })}`
      },
      facebook: {
        name: 'facebook',
        link: `http://www.facebook.com/sharer/sharer.php${getUtmTracking({
          u: locals.url,
          quote: episodeData ? `${episodeData.title} - ${episodeData.description}` : undefined,
          utm_source: 'facebook.com'
        }
        )}`
      },
      twitter: {
        name: 'twitter',
        link: `https://twitter.com/share${getUtmTracking({
          text: episodeData ? 'Check this out, ' : podcastData.title,
          via: podcastData.twitterHandle | '@radiodotcom',
          utm_source: 'twitter.com'
        })}`
      }
    };

    /*
    * [ON-1683] Awaiting API to define subscriptions data to be able to display or hide subscription buttons.
    */
    data._computed.subscriptions = {
      //  google: 'https://google.com',
      //  apple: 'https://apple.com',
      // rss: episodeData ? episodeData.rss_feed : podcastData.rss_feed
    };
    data._computed.DEFAULT_RADIOCOM_LOGO = DEFAULT_RADIOCOM_LOGO;
    return data;
  }
});
