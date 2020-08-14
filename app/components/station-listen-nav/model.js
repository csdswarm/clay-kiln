'use strict';

const addSocialButtons = require('../../services/universal/add-social-buttons'),
  { unityComponent } = require('../../services/universal/amphora'),
  { playingClass } = require('../../services/universal/spaLocals'),
  { getNowPlaying, getSchedule } = require('../../services/universal/station'),
  _get = require('lodash/get'),

  /**
   * Appends ? or & to end of img string
   *
   * @param {string} img
   * @param {Object} locals -- includes site
   * @returns {string}
   */
  appendParamsAmpOrQuery = (img, { site }) => {
    img = img || site.radiocomDefaultImg;
    img = img.includes('?') ?
      `${ img }&` :
      `${ img }?`;

    return img;
  };

module.exports = unityComponent({
  render: async (ref, data, locals) => {
    if (!_get(locals, 'station.id')) {
      return data;
    }

    await Promise.all([
      getNowPlaying(locals.station.id, data, locals, {
        radioApiOpts: {
          amphoraTimingLabelPrefix: 'get now playing',
          shouldAddAmphoraTimings: true
        }
      }),
      getSchedule(
        {
          stationId: locals.station.id,
          pageSize: 50,
          pageNum: 1,
          filterByDay: true
        },
        locals,
        {
          data,
          onAir: true,
          radioApiOpts: {
            amphoraTimingLabelPrefix: 'get schedule',
            shouldAddAmphoraTimings: true
          }
        }
      )
    ]);

    data.playingClass = playingClass(locals, locals.station.id);
    data._computed.station = locals.station;

    data.featuredLinks.forEach(link => {
      link.image = appendParamsAmpOrQuery(link.image, locals);
      link.url = link.type === 'content' ? link.contentURL : link.URL;
    });
    if (data.nowPlaying) {
      data.nowPlaying.imageUrl = appendParamsAmpOrQuery(data.nowPlaying.imageUrl, locals);
    }
    if (data.onAir) {
      data.onAir.image = appendParamsAmpOrQuery(data.onAir.image, locals);
    }

    addSocialButtons(data);

    if (!data.podcastsUrl) {
      data.podcastsUrl = '/audio';
    }

    return data;
  }
});
