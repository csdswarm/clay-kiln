'use strict';
const radioApi = 'https://api.radio.com/v1/',
  rest = require('../../services/universal/rest'),
  geoApi = 'https://geo.radio.com/markets',
  localStorage = window.localStorage;

class StationsCarousel {
  constructor(element) {
    this.allStationsCount = 303;
    this.stationsCarousel = element;
    this.innerContainerClass = 'stations-carousel__carousel';
    this.filterStationsBy = this.stationsCarousel.getAttribute('data-filter-stations-by-track');
    this.genre = this.stationsCarousel.getAttribute('data-genre-track');
    this.sectionFront = this.stationsCarousel.getAttribute('data-section-front-track');
    this.stationsList = this.stationsCarousel.querySelector('ul');
    this.leftArrow = this.stationsCarousel.querySelector('.stations-carousel__arrow--left');
    this.rightArrow = this.stationsCarousel.querySelector('.stations-carousel__arrow--right');
    this.paginationDots = this.stationsCarousel.querySelector('.carousel__pagination-dots');
    this.dotClass = 'pagination-dots__dot';
    this.marketID = localStorage.getItem('marketID');
    this.pageSize = 1; // Number of stations to move left/right when navigating
    this.gutterWidth = 20;
    this.imageSize = 140 + this.gutterWidth;
    this.pageNum = 1;
    this.windowWidth = window.outerWidth;
    this.windowSizes = {
      large: 1280,
      medium: 1024,
      beforeMediumSmall: 788,
      mediumSmall: 480
    };

    if (this.filterStationsBy == 'section-front') {
      this.filterByValue = this.sectionFront;
      if (this.sectionFront == 'entertainment') {
        this.filterByValue = 'music';
      }
    } else if (this.filterStationsBy == 'genre') {
      this.filterByValue = this.genre;
    }
    this.updateStations();
  }
}
StationsCarousel.prototype = {
  /**
   * Set stations' image size and page size
   * @function
   */
  setImageAndPageDims: function () {
    this.layoutWidth = this.stationsCarousel.querySelector(`.${this.innerContainerClass}`).offsetWidth + 'px';
    if (this.windowWidth >= this.windowSizes.large) {
      this.stationsVisible = 7;
    } else if (this.windowWidth >= this.windowSizes.medium) {
      this.stationsVisible = 6;
    } else {
      this.gutterWidth = 31;
      this.pageSize = 3;
      this.stationsVisible = 3;
      this.imageSize = 222 + this.gutterWidth;
      if (this.windowWidth < this.windowSizes.beforeMediumSmall) {
        this.gutterWidth = 20;
        this.layoutWidth = 100%;
        if (this.windowWidth < this.windowSizes.mediumSmall) {
          this.pageSize = 2;
          this.stationsVisible = 2;
        }
        let calculatedImageSize = (document.body.clientWidth - 40 - this.gutterWidth * (this.stationsVisible - 1)) / this.stationsVisible;

        this.imageSize = calculatedImageSize + this.gutterWidth;
        // set image size dependent on window size
        for (let i = 0; i < this.stationsNodes.length; i++) {
          this.stationsNodes.thumbs[i].setAttribute('style', `width: ${calculatedImageSize}px; height: ${calculatedImageSize}px;`);
        }
      }
    }
    // reset image size style after switching to large window width (image sizes are fixed at this window width)
    if (this.windowWidth >= this.windowSizes.medium) {
      for (let i = 0; i < this.stationsNodes.length; i++) {
        this.stationsNodes.thumbs[i].setAttribute('style', '');
      }
    }
  },
  /**
   * Set width of carousel to full window width
   * @function
   */
  setCarouselWidth: function () {
    // set width of carousel to full width and display it to prevent flashing
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
    _this.totalPages = Math.ceil(_this.stationsData.count / _this.pageSize);
    _this.setCarouselWidth();
    if (_this.windowWidth < _this.windowSizes.medium) {
      _this.createPaginationDots();
    }
    _this.getPage(null, _this);
  },
  /**
   * Hide or show navigation arrows if at the end or start of station results in carousel
   * @function
   */
  hideOrShowEndArrows: function () {
    if (this.windowWidth >= this.windowSizes.medium) {
      let visible = 'visibility: visible',
        hidden = 'visibility: hidden';

      if (this.pageNum <= 1) {
        this.leftArrow.setAttribute('style', hidden);
        this.rightArrow.setAttribute('style', visible);
      } else {
        this.leftArrow.setAttribute('style', visible);
        this.rightArrow.setAttribute('style', visible);
      }
      if (this.pageNum > this.totalPages - this.stationsVisible) {
        this.rightArrow.setAttribute('style', hidden);
      }
    }
  },
  /**
   * Center station results on first or last page if they don't fill up the page
   * @function
   */
  centerPageResults: function () {
    let remainderStations = this.stationsData.count % this.pageSize;

    if (this.totalPages * this.pageSize <= this.stationsVisible) { // Center stations if fills short of first page
      this.stationsList.classList.add('align-center');
      for (let i = 0; i < this.stationsNodes.length - remainderStations; i++) {
        this.stationsNodes[i].style.visibility = 'visible';
      } // reset visibility
    } else if (this.pageNum == this.totalPages) { // Center stations if fill short of last page
      if (remainderStations > 0) {
        // hide previous page results
        for (let i = 0; i < this.stationsNodes.length - remainderStations; i++) {
          this.stationsNodes[i].style.visibility = 'hidden';
        }
        // center stations on last page
        let centeredLocation = - (this.pageStationsLocation - (this.stationsVisible - remainderStations) * this.imageSize / 2);

        this.stationsList.setAttribute('style',`transform: translateX(${centeredLocation}px);`);
      }
    } else {
      // unhide other stations & unset centering if not on first/last page
      for (let i = 0; i < this.stationsNodes.length - remainderStations; i++) {
        this.stationsNodes[i].style.visibility = 'visible';
      } // reset visibility
      this.stationsList.setAttribute('style',`transform: translateX(-${this.pageStationsLocation}px);`); // uncenter last page
      this.stationsList.classList.remove('align-center'); // uncenter first page
    }
  },
  /**
   * Remove existing pagination dots and replace with newly created dots
   * @function
   */
  createPaginationDots: function () {
    // Remove existing pagination
    while (this.paginationDots.lastChild) {
      this.paginationDots.removeChild(this.paginationDots.lastChild);
    }
    if (this.totalPages > 1) { // Create pagination dots if more than one page
      for (let page = 1; page <= this.totalPages; page++) {
        let dot = document.createElement('div');

        dot.setAttribute('class', this.dotClass);
        dot.setAttribute('data-page', page);
        dot.addEventListener('click', function (e) {
          this.getPage(e, this);
        }.bind(this));
        this.paginationDots.appendChild(dot);
      }
    }
    this.updatePaginationDots();
  },
  /**
   * Update style of dots and show new page results on click of arrows or pagination dots
   * @function
   */
  updatePaginationDots: function () {
    if (this.totalPages > 1) {
      let allDots = this.stationsCarousel.querySelectorAll(`.${this.dotClass}`);

      // Remove active styling for previous active page dot & set active class for currently active page dot
      for (let d = 0; d < allDots.length; d++) {
        allDots[d].classList.remove('dot--active');
      }
      this.stationsCarousel.querySelector(`.${this.dotClass}[data-page='${this.pageNum}']`).classList.add('dot--active');
    }
  },
  /**
   * Show new page results on click of arrows or pagination dots
   * @param {object} event
   * @param {object} _this
   * @function
   */
  getPage: function (event, _this) {
    if (_this.windowWidth < _this.windowSizes.medium) { // nav using pagination dots
      if (event) {
        _this.pageNum = Number(event.currentTarget.getAttribute('data-page'));
      } // get page number of clicked dot
      _this.updatePaginationDots();
    } else { // nav using left/right arrows
      // reset page number if on nonexistent page after switching from dots pagination to arrow navigation
      if (_this.pageNum > _this.totalPages + 1 - _this.stationsVisible) {
        _this.pageNum = 1;
      }
      if (event) { // if arrow clicked, update page number
        if (event.currentTarget.getAttribute('data-direction') == 'left') {
          _this.pageNum = _this.pageNum - 1;
        } else if (_this.pageNum <= _this.totalPages - _this.stationsVisible) {
          _this.pageNum = _this.pageNum + 1;
        }
      }
      _this.hideOrShowEndArrows();
    }
    // Calculate location of page in all station results and slide results to that page
    _this.pageStationsLocation = (_this.pageNum - 1) * _this.pageSize * _this.imageSize;
    _this.stationsList.setAttribute('style',`transform: translateX(-${_this.pageStationsLocation}px);`);
    _this.centerPageResults();
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
          localStorage.setItem('marketID', marketData.Markets[0].id); // Store market in browser
          this.marketID = localStorage.getItem('marketID'); // Store market in var
        } else {
          this.marketID = 14;
        } // National market if no results from geo API
      });
    } else {
      return Promise.resolve();
    }
  },
  /**
   * Get stations from api using market ID and filters
   * @function
   * @returns {Promise}
   */
  getFilteredStationsFromApi: function () {
    let params = `?sort=-popularity&filter[market_id]=${this.marketID}&page[size]=${this.allStationsCount}`;

    if (this.filterStationsBy == 'section-front') {
      params += `&filter[category]=${this.filterByValue}`;
    } else if (this.filterStationsBy == 'genre') {
      params += `&filter[genre_id]=${this.filterByValue}`;
    }

    return rest.get(`${radioApi}stations${params}`).then(response => {
      if (response.data) {
        let stationsData = {
          stations: response.data.map(station => {
            return station.attributes;
          }),
          count: response.meta.count // Store total count of station results to determine pagination
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
    this.stationsList.removeChild(this.stationsList.querySelector('.loader-container'));// Remove loader
    this.stationsData.stations.forEach(function (stationData) {
      let station = document.createElement('li');

      station.innerHTML = `
        <a href='${stationData.listen_live_url ? stationData.listen_live_url : 'https://player.radio.com'}' target='_blank'>
          <img class='thumb'
              srcset='${stationData.square_logo_large ? stationData.square_logo_large : ''}?width=222&dpr=1.5 1.5x,
                ${stationData.square_logo_large ? stationData.square_logo_large : ''}?width=222&dpr=2 2x'
              src='${stationData.square_logo_large ? stationData.square_logo_large : ''}?width=222'
          />
          <span>${stationData.name ? stationData.name : ''}</span>
        </a>
      `;
      this.stationsList.appendChild(station);
    }.bind(this));
    // Store for stations centering when stations do not fill up page
    this.stationsNodes = this.stationsCarousel.querySelectorAll('li');
    // Store for image resizing when window width is medium or smaller
    this.stationsNodes.thumbs = this.stationsCarousel.querySelectorAll('.thumb');
  },
  /**
   * Initial function - retrieve new payload of stations into DOM and enable navigation
   * @function
   * @returns {Promise}
   */
  updateStations: function () {
    return this.getMarket().then(() => {
      return this.getFilteredStationsFromApi().then(stationsData => {
        this.stationsData = stationsData;
        this.updateStationsDOM();
        this.setImageAndPageDims();
        this.setCarouselWidth();
        this.totalPages = Math.ceil(this.stationsData.count / this.pageSize);
        this.hideOrShowEndArrows();
        this.centerPageResults();
        if (this.windowWidth < this.windowSizes.medium) {
          this.createPaginationDots();
        }
        this.leftArrow.addEventListener('click', function (e) {
          this.getPage(e, this);
        }.bind(this));
        this.rightArrow.addEventListener('click', function (e) {
          this.getPage(e, this);
        }.bind(this));
        window.addEventListener('resize', function (e) {
          this.restyleCarousel(e, this);
        }.bind(this));
        return stationsData;
      });
    });
  }
};

module.exports = el => new StationsCarousel(el);
