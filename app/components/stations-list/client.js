'use strict';
const radioApi = `${window.location.protocol}//${window.location.hostname}/api/v1/`,
  market = require('../../services/client/market'),
  recentStations = require('../../services/client/recentStations'),
  radioApiService = require('../../services/client/radioApi'),
  { isMobileWidth } = require('../../services/client/mobile'),
  insertInlineAdsEvent = new CustomEvent('inlineAdsInserted'),
  stationsListObserver = new MutationObserver(() => {
    document.dispatchEvent(insertInlineAdsEvent);
    stationsListObserver.disconnect();
  }),
  STATIONS_DIRECTORY = 'stations directory',
  STATION_DETAIL = 'station detail',
  FEATURED = 'featured';

class StationsList {
  constructor(element) {
    this.allStationsCount = 1000;
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
    const page = document.body.querySelector('.content__main > section'),
      stationsDataEl = element.querySelector('.stations-list__data');

    if (page.getAttribute('data-inline-ads')) {
      this.pageType = STATIONS_DIRECTORY;
      this.directoryType = page.querySelector('.directory-body__directory-page').getAttribute('id').replace('stations-directory__', '');
    } else if (page.classList.contains('component--station-detail')) {
      this.pageType = STATION_DETAIL;
    }

    this.stationsData = stationsDataEl ? JSON.parse(stationsDataEl.innerText) : [];
    this.updateStations();
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadMoreStations() );
    }
    window.addEventListener('resize', this.toggleSeeAllLinkAndAds.bind(this) );
    document.addEventListener('stations-list-dismount', () => {
      // code to run when vue dismounts/destroys, aka just before a new "pageview" will be loaded.
      window.removeEventListener('resize', this.toggleSeeAllLinkAndAds );
    }, { once: true });
  }
}
StationsList.prototype = {
  /**
   * Get local stations from api
   * @function
   * @returns {Promise}
   */
  getLocalStationsFromApi: async function () {
    const params = `?sort=-popularity&filter[market_id]=${this.marketID}&page[size]=${this.allStationsCount}`,
      stationsResponse = await radioApiService.get(`${radioApi}stations${params}`);

    return stationsResponse.map(station => {
      return station.attributes;
    });
  },
  /**
   * Show/hide see all link depending on
   * number of results and the page width
   * @function
   */
  toggleSeeAllLinkAndAds: function () {
    if (window.innerWidth >= 1280) {
      if (this.pageType === STATION_DETAIL) {
        this.stationsShownOnLoad = this.stationsShownInTwoRows = 10;
      } else if (this.directoryType === FEATURED) {
        this.stationsShownOnLoad = this.stationsShownInTwoRows = 14;
      } else {
        this.stationsShownOnLoad = 7;
        this.stationsShownInTwoRows = 14;
      }
    } else if (window.innerWidth >= 1024) {
      if (this.pageType === STATION_DETAIL) {
        this.stationsShownOnLoad = this.stationsShownInTwoRows = 8;
      } else {
        this.stationsShownOnLoad = this.stationsShownInTwoRows = 12;
      }
    } else {
      this.stationsShownOnLoad = this.stationsShownInTwoRows = 6;
    }

    // Hide see all link if there aren't enough to fill the list or on mobile
    if (this.seeAllLink) {
      if (this.stationsData.length <= this.stationsShownOnLoad || isMobileWidth) {
        this.seeAllLink.style.display = 'none';
      } else {
        this.seeAllLink.style.display = 'flex';
      }
    }
    if (this.pageType === STATIONS_DIRECTORY) {
      this.insertInlineAds();
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
   * Get ad component template
   * @function
   * @returns {Node}
   */
  getAdComponentTemplate: async function () {
    return await radioApiService.fetchDOM(`//${window.location.hostname}/_components/google-ad-manager/instances/billboardBottom.html`);
  },
  /**
   * Insert inline ad every two rows of results
   * Rows are dynamic based on window width and page type
   * @function
   */
  insertInlineAds: async function () {
    /* Observe when the inline ad has been inserted into the stations list
    *  so that we can send an event for google-ad-manager client.js to listen to
    *  and reset ad setup for these new ads
    */
    stationsListObserver.observe(this.stationsList, { attributes: false, childList: true, subtree: true });

    if (!this.inlineAd) {
      this.inlineAd = await this.getAdComponentTemplate();
      this.inlineAd.setAttribute('data-inline', true);
    }

    const inlineAdClass = 'component--google-ad-manager';

    /* insert new inline ad every 2 rows of stations
    *  rows determined by page type & breakpoint set in toggleSeeAllLinkAndAds */
    this.stationsList.querySelectorAll('li.station').forEach((station, i) => {
      /* check that station is not last in list so we
      *  don't add an inline ad at the end of the list */
      if (station.nextElementSibling) {
        // Add inline ad if it is the last station of the 2 rows and there is no inline ad already there
        if ((i + 1) % this.stationsShownInTwoRows === 0 &&
          !station.nextElementSibling.classList.contains(inlineAdClass)
        ) {
          station.insertAdjacentElement('afterend', this.inlineAd);
        } else if ((i + 1) % this.stationsShownInTwoRows !== 0 &&
          station.nextElementSibling.classList.contains(inlineAdClass)
        ) {
          station.nextElementSibling.remove();
        }
      }
    });

  },
  /**
   * Get stations list template from component
   * @function
   * @param {object[]} stationIDs
   * @param {string} [filter] -- category, genre, or market type
   * @returns {Node}
   */
  getComponentTemplate: async function (stationIDs, filter) {
    let queryParamString = '?',
      instance = this.filterStationsBy;

    if (stationIDs) {
      queryParamString += `&stationIDs=${stationIDs}`;
    } else if (filter) {
      if (this.truncateStations) {
        instance += 'Truncated';
      }
      queryParamString += `&${this.filterStationsBy}=${filter}`;
    }

    return await radioApiService.fetchDOM(`//${window.location.hostname}/_components/stations-list/instances/${instance}.html${queryParamString}`);
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

    this.stationsList.append(newStations);
    this.toggleLoader();
    this.displayActiveStations();
  },
  /**
   * Using filter by category, genre or market,
   * insert new payload of stations into DOM
   * @function
   */
  updateStationsDOMFromFilterType: async function () {
    const newStations = await this.getComponentTemplate(null, this.filterStationsByCategory || this.filterStationsByGenre || this.filterStationsByMarket);

    this.parentElement.append(newStations);
    this.stationsList = this.parentElement.querySelector('ul');
    this.displayActiveStations();
    this.loader = this.parentElement.querySelector('.loader-container');
    // Hide loaders once loaded
    this.toggleLoader();

    // eslint-disable-next-line one-var
    const stationsDataEl = this.parentElement.querySelector('.stations-list__data');

    this.stationsData = stationsDataEl ? JSON.parse(stationsDataEl.innerText) : [];
    this.seeAllLink = this.parentElement.querySelector('.header-row__see-all-link');
    this.toggleSeeAllLinkAndAds();
    this.loadMoreBtn = this.parentElement.querySelector('.stations-list__load-more');
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadMoreStations() );
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
      this.stationsData = await this.getLocalStationsFromApi();
      this.updateStationsDOMWithIDs(this.stationsData);
    } else if (this.filterStationsBy === 'recent') {
      this.toggleLoader();
      const stationsData = this.stationsData = await recentStations.get();

      stationsData.slice(0, 7);
      this.updateStationsDOMWithIDs(stationsData);
    } else {
      // server side populated
      if (this.filterStationsByCategory || this.filterStationsByGenre || this.filterStationsByMarket) {
        this.toggleLoader();
        this.updateStationsDOMFromFilterType();
      } else {
        this.toggleSeeAllLinkAndAds();
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
