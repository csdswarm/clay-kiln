'use strict';
const localStorageKey = 'recentStations',
  recentStations = localStorage.getItem(localStorageKey);

/**
 * Get recent stations from localStorage
 *
 * @returns {Object[]}
 */
function get() {
  let recentStations = localStorage.getItem(localStorageKey);

  if (!recentStations) {
    return [];
  } else {
    return JSON.parse(recentStations);
  }
}

/**
 * Add most recent station to localStorage
 * (Should trigger when on station page or station play)
 */
function add(station) {
  /** note: no need to limit stations stored
    total size of 313 stations' full JSON api data is ~ 0.637609 MB.
    localStorage has a limit of 5 MB **/

  if (station) {
    let recentStations = get();
    const formattedStation = {
        id: station.id,
        name: station.name,
        slogan: station.slogan,
        description: station.description,
        website: station.website,
        callsign: station.callsign,
        slug: station.slug,
        category: station.category,
        square_logo_large: station.square_logo_large,
        triton_id: station.triton_id,
        triton_name: station.triton_name,
        city: station.city,
        state: station.state,
        gmt_offset: station.gmt_offset,
        market_id: station.market_id,
        doubleclick_prerolltag: station.doubleclick_prerolltag,
        doubleclick_bannertag: station.doubleclick_bannertag,
        popularity: station.popularity,
        market_name: station.market_name,
        genre_name: station.genre_name,
        genre: station.genre,
        station_stream: station.station_stream
      };

    if (recentStations[0].id !== formattedStation.id) {

      // dedupe stations stored
      recentStations.forEach(function(station, i, stations) {
        if (station.id == formattedStation.id || !station.id) {
          stations.splice(i, 1);
        }
      });

      recentStations.unshift(formattedStation);

      try {
        localStorage.setItem(localStorageKey, JSON.stringify(recentStations)); // Store recent stations in browser
      } catch (e) {
        console.log('error storing station: ', e);
      }
    }
  }
}

module.exports = {
  get: get,
  add: add
};
