'use strict';
const radioApi = `${window.location.protocol}//${window.location.hostname}/api/v1/`,
  market = require('../../services/client/market'),
  recentStations = require('../../services/client/recentStations'),
  radioApiService = require('../../services/client/radioApi'),
  Handlebars = require('handlebars');

require('clayhandlebars')(Handlebars);

class StationsList {
  constructor(element) {
    this.allStationsCount = 350;
    this.stationsListContainer = element;
    this.page = document.querySelector('.content__main > section');
    this.truncateStations = element.getAttribute('data-truncate');
    this.filterStationsBy = element.getAttribute('data-filter-stations-by-track');
    this.stationsList = element.querySelector('ul');
    this.loadMoreBtn = element.querySelector('.stations-list__load-more');
    this.pageNum = 1;
    let stationsDataEl = element.querySelector('.stations-list__data');

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
   * @param {object} stationsData
   * @returns {Promise}
   */
  updateStationsDOM: async function (stationsData) {
    let buttons = await this.getButtonsHTML(),
      loader = this.stationsList.querySelector('.loader-container');

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
    `,
      template = Handlebars.compile(stationLi);

    if (loader) {
      this.stationsList.removeChild(loader); // Remove loader
    }
    stationsData.forEach(function (stationData) {
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
        this.updateStationsDOM(stationsData);
      });
    } else if (this.filterStationsBy == 'recent') {
      let stationsData;

      this.stationsData = stationsData = await recentStations.get();
      stationsData.length = 7;
      this.updateStationsDOM(stationsData);
    }
  },
  /**
   * Show x more stations in addition to current stations shown
   * @function
   * @returns {Promise}
   */
  loadMoreStations: async function () {
    // get current stations
    // ???
    // return
    this.pageNum++;
    this.stationsList.setAttribute('data-page-num', this.pageNum);

    const pageSize = 6,
      currentNumOfStationsShowing = this.stationsList.querySelectorAll('li.station').length,
      newNumOfStations = this.pageNum * pageSize;

    if (currentNumOfStationsShowing < this.stationsData.length) {
      let stationsData = this.stationsData.slice(currentNumOfStationsShowing, newNumOfStations);

      if (stationsData.length) {
        this.updateStationsDOM(stationsData);
      }
    }
    if (newNumOfStations >= this.stationsData.length) {
      this.loadMoreBtn.remove();
    }

    let listSelector = `.stations-list--truncated.component--stations-list ul[data-page-num='${this.pageNum}'] li.station:nth-of-type`,
      newStyle = `
      @media only screen and (max-width: 1023px) {
        .component--station-discover ${listSelector}(n+${newNumOfStations + 1}),
        .component--stations-directory ${listSelector}(n+${newNumOfStations + 1}),
        .component--stations-directory .stations-list--truncated[data-filter-stations-by-track='category'].component--stations-list ul[data-page-num='${this.pageNum}'] li.station:nth-of-type(n+${newNumOfStations + 1}) {
          display: none;
        }
        .component--station-discover ${listSelector}(-n+${newNumOfStations}),
        .component--stations-directory ${listSelector}(-n+${newNumOfStations}),
        .component--stations-directory .stations-list--truncated[data-filter-stations-by-track='category'].component--stations-list ul[data-page-num='${this.pageNum}'] li.station:nth-of-type(-n+${newNumOfStations}) {
          display: block;
        }
      }
      `,
      prevStyle = this.stationsListContainer.querySelector('.pagination-style'),
      styleEl = document.createElement('style');

    if (prevStyle) {
      this.stationsListContainer.removeChild(prevStyle); // Remove previous styles
    }

    this.stationsListContainer.appendChild(styleEl);
    styleEl.classList.add('pagination-style');
    styleEl.innerHTML = newStyle;
  }
};

module.exports = el => new StationsList(el);
