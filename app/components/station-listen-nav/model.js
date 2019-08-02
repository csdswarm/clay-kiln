'use strict';

const { playingClass } = require('../../services/universal/spaLocals'),
  { getNowPlaying, getSchedule } = require('../../services/universal/station'),

  /**
   * Appends ? or & to end of img string
   *
   * @param {string} img
   * @returns {string}
  */
  appendParamsAmpOrQuery = (img) => {
    img = img || 'https://images.radio.com/aiu-media/og_775x515_0.jpg';
    img = img.includes('?') ?
      `${ img }&` :
      `${ img }?`;

    return img;
  };

module.exports.render = async (ref, data, locals) => {
  if (!locals.station && !locals.station.id) {
    return data;
  }

  await Promise.all([
    getNowPlaying(locals.station.id, data),
    getSchedule(locals.station.id, locals, data, true)
  ]);

  data.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station;

  data.featuredLinks.forEach((link, i, links) => {
    links[i].image = appendParamsAmpOrQuery(link.image);
  });
  if (data.nowPlaying) {
    data.nowPlaying.imageUrl = appendParamsAmpOrQuery(data.nowPlaying.imageUrl);
  }
  if (data.onAir) {
    data.onAir.image = appendParamsAmpOrQuery(data.onAir.image);
  }

  return data;
};
