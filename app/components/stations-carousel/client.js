'use strict';
const radioApi = 'https://api.radio.com/v1/',
  rest = require('../../services/universal/rest'),
  geoApi = 'https://geo.radio.com/markets',
  localStorage = window.localStorage;

function Constructor() {
  console.log("stations carousel client js works");
  this.allStationsCount = 303;
  this.stationsCarouselClass = '.component--stations-carousel';
  this.stationsCarousel = document.querySelector(this.stationsCarouselClass);
  this.stationsList = document.querySelector(`${this.stationsCarouselClass} ul`);
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
  this.gutterWidth = 20;
  this.imageSize = 140 + this.gutterWidth;
  this.pageNum = 1;

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
  this.updateStations();
  window.addEventListener('resize', function(e){this.restyleCarousel(e, this)}.bind(this));
}

Constructor.prototype = {
  /**
   * Set stations' image size and page size
   * @function
   */
  setImageAndPageDims: function () {
    if (this.windowWidth >= 1280) {
      this.layoutWidth = '1100px';
      this.stationsViewable = 7;
    } else if (this.windowWidth >= 1024) {
      this.layoutWidth = '940px';
      this.stationsViewable = 6;
    } else { // window width < 1024
      this.layoutWidth = '728px';
      this.gutterWidth = 31;
      this.pageSize = 3;
      this.stationsViewable = 3;
      this.imageSize = 222 + this.gutterWidth;
      if (this.windowWidth < 788) {
        this.layoutWidth = '100%';
        this.gutterWidth = 20;
        if (this.windowWidth < 480) {
          this.pageSize = 2;
          this.stationsViewable = 2;
        }
        let calculatedImageSize = (document.body.clientWidth - 40 - this.gutterWidth * (this.stationsViewable - 1)) / this.stationsViewable;
        console.log(calculatedImageSize, document.body.clientWidth, this.gutterWidth, this.stationsViewable);
        this.imageSize = calculatedImageSize + this.gutterWidth;
        console.log(this.stationsNodes);
        for (let i = 0; i < this.stationsNodes.length; i++) {
          this.stationsNodes[i].setAttribute('style', `width: ${calculatedImageSize}px; height: ${calculatedImageSize}px;`);
        };
      }
    }
    if (this.windowWidth >= 1024) {
      // reset image size when resizing window after switching from small to large window widths
      for (let i = 0; i < this.stationsNodes.length; i++) {
        this.stationsNodes[i].setAttribute('style', '');
      };
    }
  },
  /**
   * Set width of carousel to full window width
   * @function
   */
  setCarouselWidth: function () {
    this.stationsCarousel.setAttribute('style',`
      display: inline-flex;
      width: ${document.body.clientWidth}px;
      margin-left: calc((${document.body.clientWidth}px - ${this.layoutWidth}) / -2);
    `);
  },
  /**
   * Reset vars to calculate and set new dimensions and pages of carousel on window resize
   * @param {object} event
   * @param {object} _this
   * @function
   */
  restyleCarousel: function (event, _this) {
    _this.windowWidth = window.outerWidth;
    _this.pageSize = 1; // Number of stations to move left/right when navigating
    _this.gutterWidth = 20;
    _this.imageSize = 140 + _this.gutterWidth;
    _this.setImageAndPageDims();
    _this.totalPages = _this.stationsData.count / _this.pageSize;
    _this.setCarouselWidth();
    if (this.windowWidth <= 1023) _this.createPaginationDots();
    _this.getPage(null, _this);
  },
  /**
   * Hide or show navigation arrows if at the end or start of station results in carousel
   * @function
   */
  hideOrShowEndArrows: function () {
    if (this.windowWidth > 1023) {
      if (this.pageNum <= 1) {
        this.leftArrow.setAttribute('style', 'visibility: hidden;')
      } else {
        this.leftArrow.setAttribute('style', 'visibility: visible;');
        if (this.pageNum > this.totalPages - this.stationsViewable) {
          this.rightArrow.setAttribute('style', 'visibility: hidden;')
        } else {
          this.rightArrow.setAttribute('style', 'visibility: visible;')
        }
      }
    }
  },
  /**
   * Remove existing pagination dots and replace with newly created dots
   * @function
   */
  createPaginationDots: function () {
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
  /**
   * Update style of dots and show new page results on click of arrows or pagination dots
   * @function
   */
  updatePaginationDots: function () {
    let allDots = document.querySelectorAll(`.${this.dotClass}`);
    for(let d = 0; d < allDots.length; d++) {
      allDots[d].classList.remove('dot--active');
    };
    document.querySelector(`.${this.dotClass}[data-page='${this.pageNum}']`).classList.add('dot--active');
  },
  /**
   * Show new page results on click of arrows or pagination dots
   * @param {object} event
   * @param {object} _this
   * @function
   */
  getPage: function (event, _this) {
    let pageStationsLocation;

    if (_this.windowWidth < 1024) { // nav using pagination dots
      if (event) _this.pageNum = event.currentTarget.getAttribute('data-page');
      pageStationsLocation = (_this.pageNum - 1) * _this.pageSize * _this.imageSize;
      _this.updatePaginationDots();
    } else { // nav using left/right arrows
      console.log('total pages: ', _this.totalPages, _this.stationsData.count, _this.pageSize);
      // reset page number if on nonexistent page after switching from dots pagination to arrow navigation
      if (_this.pageNum > _this.totalPages - _this.stationsViewable) _this.pageNum = 1;
      if (event) {
        if (event.currentTarget.getAttribute('data-direction') == 'left') {
          if (_this.pageNum !== 1) _this.pageNum = _this.pageNum - 1;
        } else {
          if (_this.pageNum <= _this.totalPages - _this.stationsViewable) _this.pageNum = _this.pageNum + 1;
        }
      }
      _this.hideOrShowEndArrows();
      pageStationsLocation = (_this.pageNum - 1) * _this.pageSize * _this.imageSize;
    }
    _this.stationsList.setAttribute('style',`transform: translateX(-${pageStationsLocation}px);`);
  },
  /**
   * Get user's local market ID with geo api & set in browser storage
   * @function
   * @returns {Promise}
   */
  getMarket: function () {
    if (!this.marketID) {
      return rest.get(geoApi).then(marketData => {
        if (marketData.Markets.length > 0) {
          console.log("updated market in client:", marketData);
          localStorage.setItem('marketID', marketData.Markets[0].id);
          return marketData.Markets[0].id;
        } else {
          return 14; // national
        }
      });
    } else {
      return Promise.resolve(this.marketID);
    }
  },
  /**
   * Get stations from api using market ID and filters
   * @function
   * @returns {Promise}
   */
  getFilteredStationsFromApi: function () {
    let params = `?sort=-popularity&filter[market_id]=${this.marketID}&page[size]=${this.allStationsCount}`;

    switch (this.filterStationsBy) {
      case 'section-front':
        params += `&filter[category]=${this.filterByValue}`;
        break;
      case 'genre':
        params += `&filter[genre_id]=${this.filterByValue}`;
        break;
      default:
    }
    return rest.get(`${radioApi}stations${params}`).then(response => {
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
  },
  /**
   * Insert new payload of stations into DOM
   * @function
   * @returns {Promise}
   */
  updateStationsDOM: function () {
    while (this.stationsList.lastChild) {
      this.stationsList.removeChild(this.stationsList.lastChild);
    }
    for (let i = 0; i < this.stationsData.count; i++) {
      let station = document.createElement('li'),
        stationData = this.stationsData.stations[i];

      station.innerHTML = `
        <a href='${stationData.listen_live_url}' target='_blank'>
          <img class='thumb'
              srcset='${stationData.square_logo_large}?width=222&dpr=1.5 1.5x,
                ${stationData.square_logo_large}?width=222&dpr=2 2x'
              src='${stationData.square_logo_large}?width=222'
          />
          <span>${stationData.name}</span>
        </a>
      `;
      this.stationsList.appendChild(station);
    }
    this.stationsNodes = document.querySelectorAll(`${this.stationsCarouselClass} .thumb`);
  },
  /**
   * Initial function - retrieve new payload of stations into DOM and enable navigation
   * @function
   * @returns {Promise}
   */
  updateStations: function () {
    return this.getMarket().then(() => {
      return this.getFilteredStationsFromApi().then(stationsData => {
        console.log("updated stations in client:", stationsData);
        this.stationsData = stationsData;
        this.updateStationsDOM();
        this.setImageAndPageDims();
        this.setCarouselWidth();
        this.totalPages = this.stationsData.count / this.pageSize;
        this.hideOrShowEndArrows();
        if (this.windowWidth <= 1023) this.createPaginationDots();

        this.leftArrow.addEventListener('click', function(e){this.getPage(e, this)}.bind(this));
        this.rightArrow.addEventListener('click', function(e){this.getPage(e, this)}.bind(this));
        return stationsData;
      }).catch((e) => {
        this.stationsData = [];
        this.totalPages = 0;
        this.hideOrShowEndArrows();
        console.log("Update stations query error: ", e);
      });
    });
  }
};

module.exports = () => new Constructor();
