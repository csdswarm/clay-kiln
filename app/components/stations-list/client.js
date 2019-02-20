'use strict';
const radioApi = `${window.location.protocol}//${window.location.hostname}/api/v1/`,
  market = require('../../services/client/market'),
  recentStations = require('../../services/client/recentStations'),
  radioApiService = require('../../services/client/radioApi'),
  spaLinkService = require('../../services/client/spaLink');

class StationsList {
  constructor(element) {
    this.allStationsCount = 1000;
    this.stationsListContainer = element;
    this.truncateStations = element.getAttribute('data-truncate');
    this.filterStationsBy = element.getAttribute('data-filter-stations-by-track');
    this.stationsList = element.querySelector('ul');
    this.loadMoreBtn = element.querySelector('.stations-list__load-more');
    this.loader = element.querySelector('.loader-container');
    this.pageNum = 1;
    this.pageSize = 6;
    const stationsDataEl = element.querySelector('.stations-list__data');

    this.stationsData = stationsDataEl ? JSON.parse(element.querySelector('.stations-list__data').innerText) : [];
    this.updateStations();
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadMoreStations() );
    }
  }
}
StationsList.prototype = {
  /**
   * Get local stations from api
   * @function
   * @returns {Promise}
   */
  getLocalStationsFromApi: function () {
    const params = `?sort=-popularity&filter[market_id]=${this.marketID}&page[size]=${this.allStationsCount}`;

    return radioApiService.get(`${radioApi}stations${params}`).then(response => {
      if (response.data) {
        const stationsData = {
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
   * Show or hide loader
   * @function
   */
  toggleLoader: function () {
    if (this.loader) {
      this.loader.classList.toggle('active');
    }
  },
  /**
   * Get stations list template from component
   * @function
   * @returns {object}
   */
  getComponentTemplate: async function () {
    const parser = new DOMParser(),
      listHTML = await fetch(`//${window.location.hostname}/_components/stations-list/instances/${this.filterStationsBy}.html?ignore_resolve_media=true`),
      htmlText = await listHTML.text(),
      doc = parser.parseFromString(htmlText, 'text/html');

    return doc.querySelector('li.station a');
  },
  /**
   * Inject station data into station list template
   * @function
   * @param {object} station
   * @returns {string}
   */
  getStationTemplateWithData: async function (station) {
    if (!this.stationTemplate) {
      this.stationTemplate = await this.getComponentTemplate();
    }

    // @todo ON-552 Set up SPA holepunching for components
    this.stationTemplate.setAttribute('href', `${ window.location.origin }/${ station.id }/listen`);
    this.stationTemplate.querySelector('.lede__image').setAttribute('src', `${ station.square_logo_large }?width=140&height=140&crop=1:1,offset-y0`);
    this.stationTemplate.querySelector('.lede__image').setAttribute('srcset', `
      ${ station.square_logo_large }?width=140&height=140&crop=1:1,offset-y0 140w,
      ${ station.square_logo_large }?width=222&height=222&crop=1:1,offset-y0 222w,
      ${ station.square_logo_large }?width=210&height=210&crop=1:1,offset-y0 210w,
      ${ station.square_logo_large }?width=150&height=150&crop=1:1,offset-y0 150w
    `);
    this.stationTemplate.querySelector('.station__name').innerText = station.name;
    this.stationTemplate.querySelector('.station__secondary-info').innerText = station.slogan;

    return this.stationTemplate.outerHTML;
  },
  /**
   * Add active class to stations that should be visible
   * @function
   */
  displayActiveStations: function () {
    const stations = this.stationsList.querySelectorAll('li.station');

    stations.forEach((station, i) => {
      if (i < this.pageNum * this.pageSize) {
        station.classList.add('active');
      }
    });
  },
  /**
   * Insert new payload of stations into DOM
   * @function
   * @param {object} stationsData
   */
  updateStationsDOM: function (stationsData) {
    this.toggleLoader();
    stationsData.forEach(async (stationData) => {
      const station = document.createElement('li');

      this.stationsList.appendChild(station);
      station.classList.add('station');
      station.innerHTML = await this.getStationTemplateWithData(stationData);
      spaLinkService(station.querySelector('a'));
    });
    this.displayActiveStations();
  },
  /**
   * Initial function - retrieve new payload of stations into DOM
   * @function
   */
  updateStations: async function () {
    if (this.filterStationsBy == 'local') {
      this.toggleLoader();
      this.marketID = await market.getID();
      this.getLocalStationsFromApi().then(stationsData => {
        this.stationsData = stationsData;
        this.updateStationsDOM(stationsData);
      });
    } else if (this.filterStationsBy == 'recent') {
      this.toggleLoader();
      const stationsData = this.stationsData = await recentStations.get();

      stationsData.length = 7;
      this.updateStationsDOM(stationsData);
    } else {
      // server side populated
      this.displayActiveStations();
    }
  },
  /**
   * Show x more stations in addition to current stations shown
   * @function
   * @returns {Promise}
   */
  loadMoreStations: async function () {
    this.pageNum++;

    const currentNumOfStationsShowing = this.stationsList.querySelectorAll('li.station').length,
      newNumOfStations = this.pageNum * this.pageSize;

    if (currentNumOfStationsShowing < this.stationsData.length) {
      const stationsData = this.stationsData.slice(currentNumOfStationsShowing, newNumOfStations);

      if (stationsData.length) {
        this.toggleLoader();
        this.updateStationsDOM(stationsData);
      } else {
        this.displayActiveStations();
      }
    } else {
      this.displayActiveStations();
    }
    if (newNumOfStations >= this.stationsData.length) {
      this.loadMoreBtn.remove();
    }
  }
};

module.exports = el => new StationsList(el);
