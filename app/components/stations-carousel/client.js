'use strict';
const radioApi = 'https://api.radio.com/v1/',
  geoApi = 'https://geo.radio.com/markets',
  localStorage = window.localStorage,
  _defaults = require('lodash/defaults');

// global
require('isomorphic-fetch');

/**
 * check status after doing http calls
 * note: this is necessary because fetch doesn't reject on errors,
 * only on network failure or incomplete requests
 * @param  {object} res
 * @return {object}
 * @throws {Error} on non-2xx status
 */
function restCheckStatus (res) {
  if (res.status >= 200 && res.status < 300) {
    return res;
  } else {
    const error = new Error(res.statusText);

    error.response = res;
    throw error;
  }
}
/**
 * GET
 * @param {string} url
 * @param {object} opts See https://github.github.io/fetch/#options
 * @return {Promise}
 */
function restGet (url, opts) {
  const conf = _defaults({method: 'GET'}, opts);

  return fetch(url, conf).then(restCheckStatus).then(function (res) { return res.json(); });
};

function Constructor() {
  console.log("stations carousel client js works");
  this.stationsCarousel = document.querySelector('.component--stations-carousel');
  this.stationsList = this.stationsCarousel.querySelector('ul');
  this.filterStationsBy = this.stationsCarousel.getAttribute('data-filter-stations-by-track');
  this.genre = this.stationsCarousel.getAttribute('data-genre-track');
  this.sectionFront = this.stationsCarousel.getAttribute('data-section-front-track');
  this.windowWidth = window.outerWidth;
  this.paginationDots = document.querySelector('.carousel__pagination-dots');
  this.dotClass = 'pagination-dots__dot';
  this.leftArrow = document.querySelector('.stations-carousel__arrow--left');
  this.rightArrow = document.querySelector('.stations-carousel__arrow--right');
  this.marketID = localStorage.getItem('marketID');
  this.filterByValue = null;
  this.pageSize = 1; // Number of stations to move left/right when navigating
  this.imageSize = 140 + 20;
  this.pageNum = 1;

  if (this.windowWidth >= 1280) {
    this.layoutWidth = '1100px';
  } else if (this.windowWidth >= 1024) {
    this.layoutWidth = '940px';
  } else {
    this.layoutWidth = '728px';
    if (this.windowWidth < 788) {
      this.layoutWidth = '100%';
    }
    if (this.windowWidth >= 481) {
      this.pageSize = 3;
      this.imageSize = 222 + 20;
    } else if (this.windowWidth >= 361) {
      this.pageSize = 2;
      this.imageSize = 209 + 20;
    } else {
      this.pageSize = 2;
      this.imageSize = 150 + 20;
    }
  }

  switch (this.filterStationsBy) {
    case 'section-front':
      this.filterByValue = this.sectionFront;
      if (this.sectionFront == 'entertainment') this.filterByValue = 'music';
      break;
    case 'genre':
      this.filterByValue = this.genre;
      break;
    default:
  }

  this.stationsCarousel.setAttribute('style',`
    width: ${document.body.clientWidth}px;
    margin-left: calc((${document.body.clientWidth}px - ${this.layoutWidth}) / -2);
  `);
  this.updateStations();
  this.leftArrow.addEventListener('click', this.getPrevStation);
  this.rightArrow.addEventListener('click', this.getNextStation);
  window.addEventListener('resize', function(e){this.restyleCarousel(e, this)}.bind(this));
}

Constructor.prototype = {
  restyleCarousel: function (event, _this) {
    _this.windowWidth = window.outerWidth;
    _this.pageSize = 1; // Number of stations to move left/right when navigating
    _this.imageSize = 140 + 20;
    _this.pageNum = 1;

    if (_this.windowWidth >= 1280) {
      _this.layoutWidth = '1100px';
    } else if (_this.windowWidth >= 1024) {
      _this.layoutWidth = '940px';
    } else {
      _this.layoutWidth = '728px';
      if (_this.windowWidth < 788) {
        _this.layoutWidth = '100%';
      }
      if (_this.windowWidth >= 481) {
        _this.pageSize = 3;
        _this.imageSize = 222 + 20;
      } else if (_this.windowWidth >= 361) {
        _this.pageSize = 2;
        _this.imageSize = 209 + 20;
      } else {
        _this.pageSize = 2;
        _this.imageSize = 150 + 20;
      }
    }
    _this.stationsCarousel.setAttribute('style',`
      width: ${document.body.clientWidth}px;
      margin-left: calc((${document.body.clientWidth}px - ${_this.layoutWidth}) / -2);
    `);
    _this.createPaginationDots();
  },
  getPrevStation: function () {

  },
  getNextStation: function () {
    // transform: translateX(-160px);
  },
  createPaginationDots: function () {
    this.totalPages = this.stationsData.count / this.pageSize;
    while (this.paginationDots.lastChild) {
      this.paginationDots.removeChild(this.paginationDots.lastChild);
    }
    for (let page = 1; page <= this.totalPages; page++) {
      let dot = document.createElement('div');
      dot.setAttribute('class', this.dotClass);
      dot.setAttribute('data-page', page);
      dot.addEventListener('click', function(e){this.getPage(e, this)}.bind(this));
      this.paginationDots.appendChild(dot);
    }
    this.updatePaginationDots();
  },
  updatePaginationDots: function () {
    let allDots = document.querySelectorAll(`.${this.dotClass}`);
    for(let d = 0; d < allDots.length; d++) {
      allDots[d].classList.remove('dot--active');
    };
    document.querySelector(`.${this.dotClass}[data-page='${this.pageNum}']`).classList.add('dot--active');
  },
  getPage: function (event, _this) {
    _this.pageNum = event.currentTarget.getAttribute('data-page');
    _this.updatePaginationDots();
    let pageStationsLocation = (_this.pageNum - 1) * _this.pageSize * _this.imageSize;
    if (this.windowWidth < 1024) {
      this.stationsList.setAttribute('style',`transform: translateX(-${pageStationsLocation}px);`);
    } else {

    }
  },
  /**
   * Get user's local market ID with geo api & set in browser storage
   * @function
   */
  getMarket: function () {
    if (!this.marketID) {
      return restGet(geoApi).then(marketData => {
        if (marketData.Markets) {
          console.log("updated market in client:", marketData);
          localStorage.setItem('marketID', marketData.Markets[0].id);
          return marketData.Markets[0].id;
        } else {
          return Promise.reject();
        }
      });
    } else {
      return Promise.resolve(this.marketID);
    }
  },
  updateStations: function () {
    return this.getMarket().then(() => {
      return this.getFilteredStationsFromApi().then(stationsData => {
        console.log("updated stations in client:", stationsData);
        this.stationsData = stationsData;
        if (this.windowWidth <= 1023) this.createPaginationDots();
        while (this.stationsList.lastChild) {
          this.stationsList.removeChild(this.stationsList.lastChild);
        }
        for (let i = 0; i < stationsData.count; i++) {
          let station = document.createElement('li'),
            stationData = stationsData.stations[i];

          station.innerHTML = `
            <a href='${stationData.listen_live_url}' target='_blank'>
              <img class='thumb'
                  srcset='${stationData.square_logo_large}?width=222&dpr=1.5 1.5x,
                    ${stationData.square_logo_large}?width=222&dpr=2 2x'
                  src='${stationData.square_logo_large}?width=222'
              />
              <span>${stationData.name}</span>
            </a>
          `
          this.stationsList.appendChild(station);
        }
      }).catch((e) => {
        console.log("Update query error: ", e);
      });
    }).catch(e => {
      console.log("Market query error: ", e);
    });
  },
  getFilteredStationsFromApi: function () {
    let params = `?sort=-popularity&filter[market_id]=${this.marketID}&page[size]=300`;

    switch (this.filterStationsBy) {
      case 'section-front':
        params += `&filter[category]=${this.filterByValue}`;
        break;
      case 'genre':
        params += `&filter[genre_id]=${this.filterByValue}`;
        break;
      default:
    }
    console.log("params: ", params);
    return restGet(`${radioApi}stations${params}`).then(response => {
      if (response.data) {
        let stationsData = {
          stations: response.data.map(station => {
            return station.attributes;
          }),
          count: response.meta.count
        };
        return stationsData;
      } else {
        return Promise.reject();
      }
    });
  }
};

module.exports = () => new Constructor();
