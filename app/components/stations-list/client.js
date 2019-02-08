'use strict';
const radioApi = `${window.location.protocol}//${window.location.hostname}/api/v1/`,
  market = require('../../services/client/market'),
  recentStations = require('../../services/client/recentStations'),
  radioApiService = require('../../services/client/radioApi'),
  Handlebars = require('handlebars'),
  stationLi = `
    <a href="//{{ @root.locals.site.host }}/{{id}}/listen">
      <div class="station__lede">
        <button class="lede__favorite-btn">{{{ read 'components/stations-list/media/favorite.svg' }}}</button>
        <img class="lede__image" src="{{square_logo_large}}">
        <button class="lede__play-btn">{{{ read 'components/stations-list/media/play.svg' }}}</button>
      </div>
      <span class="station__name">{{ name }}</span>
      <span class="station__secondary-info">{{ slogan }}</span>
    </a>
  `;

require('clayhandlebars')(Handlebars);

class StationsList {
  constructor(element) {
    this.allStationsCount = 313;
    this.stationsList = element;
    this.filterStationsBy = this.stationsList.getAttribute('data-filter-stations-by-track');
    this.stationsList = this.stationsList.querySelector('ul');

    this.updateStations();
  }
}
StationsList.prototype = {
  /**
   * Get local stations from api
   * @function
   * @returns {Promise}
   */
  getLocalStationsFromApi: function () {
    let params = `?sort=-popularity&filter[market_id]=${this.marketID}&page[size]=${this.allStationsCount}`;

    return radioApiService.get(`${radioApi}stations${params}`).then(response => {
      if (response.data) {
        let stationsData = {
          stations: response.data.map(station => {
            return station.attributes;
          }),
          count: response.data.length // Store total count of station results to determine pagination
        };

        return stationsData;
      } else {
        return Promise.reject();
      }
    });
  },
  /**
   * Insert new payload of stations into DOM
   * @function
   */
  updateStationsDOM: function () {
    this.stationsList.removeChild(this.stationsList.querySelector('.loader-container')); // Remove loader
    const template = Handlebars.compile(stationLi);

    this.stationsData.stations.forEach(function (stationData) {
      let station = document.createElement('li');

      this.stationsList.appendChild(station);
      station.classList.add('station');
      station.innerHTML = template(stationData);
    }.bind(this));
  },
  /**
   * Initial function - retrieve new payload of stations into DOM
   * @function
   */
  updateStations: async function () {
    if (this.filterStationsBy == 'local') {
      this.marketID = await market.getID();

      this.getLocalStationsFromApi().then(stationsData => {
        this.stationsData = stationsData;
        this.updateStationsDOM();
      });
    } else if (this.filterStationsBy == 'recent') {
      this.stationsData = recentStations.get();
      this.updateStationsDOM();
    }
  }
};

module.exports = el => new StationsList(el);
