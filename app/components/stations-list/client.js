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
    this.parentElement = element.parentElement;
    this.filterStationsByCategory = this.parentElement.getAttribute('data-category');
    this.filterStationsByGenre = this.parentElement.getAttribute('data-genre');
    this.filterStationsByMarket = this.parentElement.getAttribute('data-market');
    this.seeAllLink = element.querySelector('.header-row__see-all-link');
    this.stationsList = element.querySelector('ul');
    this.loadMoreBtn = element.querySelector('.stations-list__load-more');
    this.loader = element.querySelector('.loader-container');
    this.pageNum = 1;
    this.pageSize = 6;
    const stationsDataEl = element.querySelector('.stations-list__data');

    this.stationsData = stationsDataEl ? JSON.parse(stationsDataEl.innerText) : [];
    this.updateStations();
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadMoreStations() );
    }
    window.addEventListener('resize', this.toggleSeeAllLink.bind(this) );
    document.addEventListener('stations-list-dismount', () => {
      // code to run when vue dismounts/destroys, aka just before a new "pageview" will be loaded.
      window.removeEventListener('resize', this.toggleSeeAllLink );
    });
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
    if (this.seeAllLink) {
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
   * @param {string} filter -- category, genre, or market type
   * @returns {object}
   */
  getComponentTemplate: async function (stationIDs, filter) {
    let queryParamString = '?ignore_resolve_media=true',
      instance = this.filterStationsBy,
      response;

    if (stationIDs) {
      queryParamString += `&stationIDs=${stationIDs}`;
    } else if (filter) {
      if (this.truncateStations) {
        instance += 'Truncated';
      }
      queryParamString += `&${this.filterStationsBy}=${filter}`;
    }

    response = await fetch(`//${window.location.hostname}/_components/stations-list/instances/${instance}.html${queryParamString}`);

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
   * Using list of station IDs,
   * insert new payload of stations into DOM
   * @function
   * @param {object} stationsData
   */
  updateStationsDOMWithIDs: async function (stationsData) {
    const stationIDs = stationsData.map((station) => {
        return station.id;
      }),
      newStations = await this.getComponentTemplate(stationIDs);

    this.stationsList.innerHTML += newStations;
    this.toggleLoader();
    this.displayActiveStations();
  },
  /**
   * Using filter by category, genre or market,
   * insert new payload of stations into DOM
   * @function
   */
  updateStationsDOMFromFilterType: async function () {
    let newStations = await this.getComponentTemplate(null, this.filterStationsByCategory || this.filterStationsByGenre || this.filterStationsByMarket);

    this.parentElement.innerHTML = newStations;
    this.stationsList = this.parentElement.querySelector('ul');
    this.displayActiveStations();
    this.loader = this.parentElement.querySelector('.loader-container');

    const stationsDataEl = this.parentElement.querySelector('.stations-list__data');

    this.stationsData = stationsDataEl ? JSON.parse(stationsDataEl.innerText) : [];
    this.seeAllLink = this.parentElement.querySelector('.header-row__see-all-link');
    this.toggleSeeAllLink();
    this.loadMoreBtn = this.parentElement.querySelector('.stations-list__load-more');
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadMoreStations(this.parentElement.querySelector('ul')) );
    }
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
        this.updateStationsDOMWithIDs(stationsData);
      });
    } else if (this.filterStationsBy === 'recent') {
      this.toggleLoader();
      const stationsData = this.stationsData = await recentStations.get();

      stationsData.length = 7;
      this.updateStationsDOMWithIDs(stationsData);
    } else {
      // server side populated
      if (this.filterStationsByCategory || this.filterStationsByGenre || this.filterStationsByMarket) {
        this.toggleLoader();
        this.updateStationsDOMFromFilterType();
      } else {
        this.toggleSeeAllLink();
        this.displayActiveStations();
      }
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
        this.updateStationsDOMWithIDs(stationsData);
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
