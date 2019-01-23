const _uniq = require('lodash/uniq');

/**
 * consolidate station data to form tags array
 * @param {object} station
 * @returns {array}
 */
function getStationTags(station) {
  let tags = [];

  tags
    .push(station.category)
    .concat(station.genre_name)
    .concat(station.market_name);

  tags = _uniq(tags);

  return tags;
}

module.exports.save = (uri, data, locals) => {
  data.station = {
    "id": 417,
    "name": "WFAN Sports Radio 66AM & 101.9 FM New York",
    "slogan": "The Flagship Station for New York Sports, the Fan, Sports Radio 66, WFAN, New York",
    "description": "WFAN Sports Radio is a Sports radio station based in New York, NY.",
    "format": "Sports",
    "website": "https://wfan.radio.com/",
    "callsign": "WFANAM",
    "slug": "wfan-sports-radio-66am-1019fm-ny",
    "category": "Sports",
    "bband": "AM",
    "frequency": "660",
    "listen_live_url": "http://player.radio.com/listen/station/wfan-sports-radio-66am-1019fm-ny",
    "stream_type": "Non-Interactive",
    "partner": "CBS",
    "status": 1,
    "hero_image": "https://images.radio.com/logos/wfan.jpg",
    "square_logo_small": "https://images.radio.com/logos/WFANAM.jpg",
    "square_logo_large": "https://images.radio.com/logos/WFANAM.jpg",
    "triton_id": 353,
    "triton_name": "WFANAM",
    "city": "New York",
    "state": "NY",
    "country": "US",
    "postal_code": "10014",
    "gmt_offset": -5,
    "observes_dst": false,
    "latitude": 40.7347,
    "longitude": -74.0053,
    "market_id": 15,
    "doubleclick_prerolltag": "NYC.SPORTS.WFANAM",
    "doubleclick_bannertag": "NYC.SPORTS.WFANAM",
    "facebook": "https://www.facebook.com/wfan660",
    "twitter": "WFAN660",
    "popularity": 2242453,
    "primary_color": "#0051BA",
    "secondary_color": "#CE1126",
    "tag_station_id": 19010,
    "nielsen_asset_id": "WFAN-FM",
    "nielsen_station_type": "2",
    "keywords": "WFANAM, New York",
    "market_name": "New York, NY",
    "phonetic_name": "W F A N Sports Radio",
    "text_number": null,
    "partner_id": 1,
    "partner_name": "Entercom",
    "stream_provider_id": null,
    "stream_provider_name": null,
    "napster_id": null,
    "napster_station_type": null,
    "market": {
    "id": 15,
    "name": "New York, NY"
    },
    "genre": [
    {
    "id": 11,
    "name": "Sports"
    }
    ],
    "genre_name": [
    "Sports"
    ],
    "mood": [],
    "mood_name": [],
    "activity": [],
    "activity_name": [],
    "station_stream": [
    {
    "type": "mp3",
    "url": "https://playerservices.streamtheworld.com/api/livestream-redirect/WFANAM.mp3"
    },
    {
    "type": "aac",
    "url": "https://playerservices.streamtheworld.com/api/livestream-redirect/WFANAMAAC.aac"
    }
    ],
    "child_stations": [],
    "parent_stations": []
  }

  return data;
  };
