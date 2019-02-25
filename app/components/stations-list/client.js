'use strict';
const radioApi = `${window.location.protocol}//${window.location.hostname}/api/v1/`,
  market = require('../../services/client/market'),
  recentStations = require('../../services/client/recentStations'),
  radioApiService = require('../../services/client/radioApi');

class StationsList {
  constructor(element) {
    this.allStationsCount = 1000;
    this.stationsListContainer = element;
    this.truncateStations = element.getAttribute('data-truncate');
    this.filterStationsBy = element.getAttribute('data-filter-stations-by-track');
    this.seeAllLink = element.querySelector('.header-row__see-all-link');
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
   * Show/hide see all link depending on
   * number of results and the page width
   * @function
   */
  toggleSeeAllLink: function () {
    let stationsShownOnLoad;

    if (window.innerWidth >= 1280) {
      stationsShownOnLoad = 10;
    } else if (window.innerWidth >= 1024) {
      stationsShownOnLoad = 8;
    } else {
      stationsShownOnLoad = 6;
    }
    if (this.stationsData.length <= stationsShownOnLoad || window.innerWidth < 480) {
      this.seeAllLink.style.display = 'none';
    } else {
      this.seeAllLink.style.display = 'flex';
    }
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
   * @param {object[]} stationIDs
   * @returns {object}
   */
  getComponentTemplate: async function (stationIDs) {
    let response = await fetch(`//${window.location.hostname}/_components/stations-list/instances/${this.filterStationsBy}.html?stationIDs=${stationIDs}&ignore_resolve_media=true`);

    return await response.text();
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
  updateStationsDOM: async function (stationsData) {
    const stationIDs = stationsData.map((station) => {
        return station.id;
      }),
      newStations = await this.getComponentTemplate(stationIDs);

    this.stationsList.innerHTML += newStations;
    this.toggleLoader();
    this.displayActiveStations();
  },
  /**
   * Initial function - retrieve new payload of stations into DOM
   * @function
   */
  updateStations: async function () {
    if (this.filterStationsBy === 'local') {
      this.toggleLoader();
      this.marketID = await market.getID();
      this.getLocalStationsFromApi().then(stationsData => {
        this.stationsData = stationsData;
        this.updateStationsDOM(stationsData);
      });
    } else if (this.filterStationsBy === 'recent') {
      this.toggleLoader();
      const stationsData = this.stationsData = await recentStations.get();

      stationsData.length = 7;
      this.updateStationsDOM(stationsData);
    } else {
      // server side populated
      window.addEventListener('resize', () => {
        this.toggleSeeAllLink();
      });
      this.toggleSeeAllLink();
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
