'use strict';

const { playingClass } = require('../../services/universal/spaLocals');

module.exports.render = async (ref, data, locals) => {
  locals.station = {
    "id": 369,
    "name": "MIX 105.1",
    "website": "http://www.mix1051.com",
    "callsign": "WOMXFM",
    "slug": "mix-1051",
    "site_slug": "mix1051",
    "category": "Music",
    "listen_live_url": "http://player.radio.com/listen/station/mix-1051",
    "hero_image": "https://images.radio.com/logos/morningmixuse.jpg",
    "square_logo_small": "https://images.radio.com/logos/mixsquaregrey.png",
    "square_logo_large": "https://images.radio.com/logos/mixsquaregrey.png",
    "primary_color": "#dd1086",
    "secondary_color": "#ffffff",
    "phonetic_name": "Mix One Oh Five Point One Orlando"
  }
  if (!locals.station && !locals.station.id) {
    return data;
  }

  data.playingClass = playingClass(locals, locals.station.id);
  data.station = locals.station;

  return data;
};
