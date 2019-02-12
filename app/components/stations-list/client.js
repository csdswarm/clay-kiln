'use strict';
const radioApi = `${window.location.protocol}//${window.location.hostname}/api/v1/`,
  market = require('../../services/client/market'),
  recentStations = require('../../services/client/recentStations'),
  radioApiService = require('../../services/client/radioApi'),
  Handlebars = require('handlebars');

require('clayhandlebars')(Handlebars);

class StationsList {
  constructor(element) {
    this.allStationsCount = 313;
    this.stationsList = element;
    this.filterStationsBy = this.stationsList.getAttribute('data-filter-stations-by-track');
    this.stationsList = this.stationsList.querySelector('ul');
    this.loadMoreBtn = this.stationsList.querySelector('.stations-list__load-more');

    this.updateStations();
    this.loadMoreBtn.addEventListener('click', function (e) { this.loadMoreStations(e); }.bind(this));
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
   * @returns {Promise}
   */
  getButtonsHTML: async function () {
    const parser = new DOMParser(),
      listHTML = await fetch(`//${window.location.hostname}/_components/stations-list/instances/${this.filterStationsBy}.html?ignore_resolve_media=true`),
      htmlText = await listHTML.text(),
      doc = parser.parseFromString(htmlText, 'text/html');

    return [doc.querySelector('.lede__favorite-btn'), doc.querySelector('.lede__play-btn')];
  },
  /**
   * Insert new payload of stations into DOM
   * @function
   * @returns {Promise}
   */
  updateStationsDOM: async function () {
    let buttons = await this.getButtonsHTML();
    const stationLi = `
      <a href="//{{ @root.locals.site.host }}/{{ id }}/listen">
        <div class="station__lede">
          ${buttons[0].outerHTML}
          <img class="lede__image"
            src="{{ square_logo_large }}?width=140&height=140&crop=1:1,offset-y0"
            srcset="{{ square_logo_large }}?width=140&height=140&crop=1:1,offset-y0 140w,
              {{ square_logo_large }}?width=222&height=222&crop=1:1,offset-y0 222w,
              {{ square_logo_large }}?width=210&height=210&crop=1:1,offset-y0 210w,
              {{ square_logo_large }}?width=150&height=150&crop=1:1,offset-y0 150w"
            sizes="(max-width: 360px) 150px, (max-width: 480px) 210px, (max-width: 1023px) 222px, 140px"
          >
          ${buttons[1].outerHTML}
        </div>
        <span class="station__name">{{ name }}</span>
        <span class="station__secondary-info">{{ slogan }}</span>
      </a>
    `;

    this.stationsList.removeChild(this.stationsList.querySelector('.loader-container')); // Remove loader
    const template = Handlebars.compile(stationLi);

    this.stationsData.forEach(function (stationData) {
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
  },
  /**
   * Show x more stations in addition to current stations shown
   * @function
   * @param {object} event
   * @param {number} pageSize
   * @param {object[]} currentResults
   * @returns {Promise}
   */
  loadMoreStations: async function (event, pageSize, currentResults) {
    // get pageSize from page type (detail pg or directory) and breakpoint
    // get current stations
    // ???
    // return

  }
};

module.exports = el => new StationsList(el);
