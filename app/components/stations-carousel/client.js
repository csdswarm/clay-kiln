'use strict';
const radioApi = `${window.location.protocol}//${window.location.hostname}/api/v1/`,
  market = require('../../services/client/market'),
  radioApiService = require('../../services/client/radioApi'),
  Hammer = require('hammerjs'),
  localStorage = window.localStorage;


class StationsCarousel {
  constructor(element) {
    this.hammerTime = new Hammer(element);
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
    this.curatedItems = this.stationsCarousel.querySelectorAll('.curated-item');
    this.dotClass = 'pagination-dots__dot';
    this.marketID = localStorage.getItem('marketID');
    this.pageSize = 1; // Number of stations to move left/right when navigating
    this.gutterWidth = Number(getComputedStyle(this.stationsCarousel.querySelector(`.${this.innerContainerClass} li`)).marginRight.replace('px',''));
    this.imageSize = Number(getComputedStyle(this.stationsCarousel.querySelector(`.${this.innerContainerClass} .thumb`)).width.replace('px','')) + this.gutterWidth;
    this.pageNum = 1;
    this.windowWidth = window.innerWidth;
    this.windowSizes = {
      large: 1280,
      medium: 1024,
      beforeMediumSmall: 788,
      mediumSmall: 480
    };

    this.hammerTime.get('swipe').set({ threshold: 5, velocity: 0.075 });

    if (this.filterStationsBy == 'section-front') {
      this.filterByValue = this.sectionFront;
    } else if (this.filterStationsBy == 'genre') {
      this.filterByValue = this.genre;
    }
    this.updateStations();
  }

  /**
   * Set stations' image size and page size
   * @function
   */
  setImageAndPageDims() {
    const firstLi = this.stationsCarousel.querySelector(`.${this.innerContainerClass} li`),
      firstThumb = this.stationsCarousel.querySelector(`.${this.innerContainerClass} .thumb`);

    this.pageSize = 1; // Number of stations to move left/right when navigating
    this.layoutWidth = getComputedStyle(this.stationsCarousel.querySelector(`.${this.innerContainerClass}`)).width;
    if (firstLi) {
      this.gutterWidth = Number(getComputedStyle(firstLi).marginRight.replace('px',''));
    }
    if (firstThumb) {
      this.imageSize = Number(getComputedStyle(firstThumb).width.replace('px','')) + this.gutterWidth;
    }
    if (this.windowWidth >= this.windowSizes.medium) {
      this.stationsVisible = 8;
    } else {
      this.layoutWidth = '100%';
      this.pageSize = 1;
      this.stationsVisible = 4;
      if (this.windowWidth < this.windowSizes.mediumSmall) {
        this.pageSize = 2;
        this.stationsVisible = 2;
      }
      if (this.windowWidth < this.windowSizes.medium) {

        let calculatedImageSize = (document.body.clientWidth - 40 - this.gutterWidth * (this.stationsVisible - 1)) / this.stationsVisible;

        if (this.stationsVisible === 4 && calculatedImageSize > 160) {
          calculatedImageSize = 160; // clamping per design
        }
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
  }

  /**
   * Set width of carousel to full window width
   * @function
   */
  setCarouselWidth() {
    let style = `display: inline-flex; width: ${document.body.clientWidth}px;`;

    if (this.stationsCarousel.closest('.layout--one-column')) {
      // set width of carousel to full width and display it to prevent flashing
      style += `margin-left: calc((${document.body.clientWidth}px - ${this.layoutWidth}) / -2);`;
    }
    this.stationsCarousel.setAttribute('style', style);
  }

  /**
   * Reset vars to calculate and set new dimensions and pages of carousel on window resize
   * @param {object} event
   * @param {object} _this
   * @function
   */
  restyleCarousel(event, _this) {
    _this.windowWidth = window.innerWidth;
    _this.setImageAndPageDims();
    _this.totalPages = Math.ceil(_this.stationsData.count / _this.pageSize);
    _this.setCarouselWidth();
    if (_this.windowWidth < _this.windowSizes.medium) {
      _this.createPaginationDots();
    }
    _this.getPage(null, _this);
  }

  /**
   * Hide or show navigation arrows if at the end or start of station results in carousel
   * @function
   */
  hideOrShowEndArrows() {
    if (this.windowWidth >= this.windowSizes.medium) {
      const visible = 'visibility: visible',
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
  }

  /**
   * Center station results on first or last page if they don't fill up the page
   * @function
   */
  centerPageResults() {
    const remainderStations = this.stationsData.count % this.pageSize;

    if (this.totalPages * this.pageSize <= this.stationsVisible) { // Center stations if fills short of first page
      this.stationsList.classList.add('align-center');
      for (let i = 0; i < this.stationsNodes.length - remainderStations; i++) { // reset visibility
        this.stationsNodes[i].style.visibility = 'visible';
      }
    } else if (this.pageNum == this.totalPages) { // Center stations if fill short of last page
      if (remainderStations > 0) {
        // hide previous page results
        for (let i = 0; i < this.stationsNodes.length - remainderStations; i++) {
          this.stationsNodes[i].style.visibility = 'hidden';
        }
        // center stations on last page
        const centeredLocation = - (this.pageStationsLocation - (this.stationsVisible - remainderStations) * this.imageSize / 2);

        this.stationsList.setAttribute('style',`transform: translateX(${centeredLocation}px);`);
      }
    } else {
      // unhide other stations & unset centering if not on first/last page
      for (let i = 0; i < this.stationsNodes.length - remainderStations; i++) { // reset visibility
        this.stationsNodes[i].style.visibility = 'visible';
      }
      this.stationsList.setAttribute('style',`transform: translateX(-${this.pageStationsLocation}px);`); // uncenter last page
      this.stationsList.classList.remove('align-center'); // uncenter first page
    }
  }

  /**
   * Remove existing pagination dots and replace with newly created dots
   * @function
   */
  createPaginationDots() {
    // Remove existing pagination
    while (this.paginationDots.lastChild) {
      this.paginationDots.removeChild(this.paginationDots.lastChild);
    }
    if (this.totalPages > 1) { // Create pagination dots if more than one page
      for (let page = 1; page <= this.totalPages; page++) {
        const dot = document.createElement('div');

        dot.setAttribute('class', this.dotClass);
        dot.setAttribute('data-page', page);
        dot.addEventListener('click', function (e) {
          this.getPage(e, this);
        }.bind(this));
        this.paginationDots.appendChild(dot);
      }
    }
    this.updatePaginationDots();
  }

  /**
   * Update style of dots and show new page results on click of arrows or pagination dots
   * @function
   */
  updatePaginationDots() {
    if (this.totalPages > 1) {
      const allDots = this.stationsCarousel.querySelectorAll(`.${this.dotClass}`);

      // Remove active styling for previous active page dot & set active class for currently active page dot
      for (let d = 0; d < allDots.length; d++) {
        allDots[d].classList.remove('dot--active');
      }
      this.stationsCarousel.querySelector(`.${this.dotClass}[data-page='${this.pageNum}']`).classList.add('dot--active');
    }
  }

  /**
   * Show new page results on click of arrows or pagination dots
   * @param {object} event
   * @param {object} _this
   * @function
   */
  getPage(event, _this) {
    const leftArrowEvent = event && event.currentTarget && event.currentTarget.getAttribute('data-direction') == 'left',
      rightArrowEvent = event && event.currentTarget && event.currentTarget.getAttribute('data-direction') == 'right',
      dotEvent = event && event.currentTarget && event.currentTarget.getAttribute('data-page') !== null,
      swipeLeftEvent = event ? event.type == 'swipeleft' : false,
      swipeRightEvent = event ?  event.type == 'swiperight' : false;

    // within this context we navigate with dots and swipe gestures
    if (_this.windowWidth < _this.windowSizes.medium) {
      if (dotEvent) { // get page number of clicked dot
        _this.pageNum = Number(event.currentTarget.getAttribute('data-page'));
      } else if (swipeRightEvent) {
        _this.pageNum -= 1;
      } else if (swipeLeftEvent) {
        _this.pageNum += 1;
      }
      if (_this.pageNum > _this.totalPages) {
        _this.pageNum = _this.totalPages;
      } else if (_this.pageNum < 1) {
        _this.pageNum = 1;
      }
      _this.updatePaginationDots();
    } else { // within this context we navigate with left/right arrows
      // reset page number if on nonexistent page after switching from dots pagination to arrow navigation
      if (_this.pageNum > _this.totalPages + 1 - _this.stationsVisible) {
        _this.pageNum = 1;
      }
      if (event) { // if arrow clicked, update page number
        if (leftArrowEvent) {
          _this.pageNum = _this.pageNum - 1;
        } else if (rightArrowEvent && _this.pageNum <= _this.totalPages - _this.stationsVisible) {
          _this.pageNum = _this.pageNum + 1;
        }
      }
      _this.hideOrShowEndArrows();
    }
    // Calculate location of page in all station results and slide results to that page
    _this.pageStationsLocation = (_this.pageNum - 1) * _this.pageSize * _this.imageSize;
    _this.stationsList.setAttribute('style',`transform: translateX(-${_this.pageStationsLocation}px);`);
    _this.centerPageResults();
  }

  /**
   * Get stations from api using market ID and filters
   * @function
   * @returns {Promise}
   */
  async getFilteredStationsFromApi() {
    let params = `?sort=-popularity&filter[market_id]=${this.marketID}&page[size]=${this.allStationsCount}`;

    if (this.filterStationsBy == 'section-front') {
      params += `&filter[category]=${this.filterByValue}`;
    } else if (this.filterStationsBy == 'genre') {
      params += `&filter[genre_id]=${this.filterByValue}`;
    }

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
  }
  addCarouselItem(el) {
    el.classList.add('station');

    this.stationsData.count++;
    this.stationsList.append(el);
  }
  /**
   * Hide the station carousel
   */
  hideStationCarousel() {
    this.stationsCarousel.style.display = 'none';
  }
  /**
   * Insert new payload of stations into DOM
   * @function
   */
  async updateStationsDOM() {
    const stationIds = this.stationsData.stations.map(station => station.id),
      endpoint = `//${window.location.hostname}/_components/stations-list/instances/local.html?stationIDs=${stationIds.join(',')}`,
      localStations = await radioApiService.fetchDOM(endpoint);

    // Clear out loader and old stuff
    while (this.stationsList.firstChild) {
      this.stationsList.removeChild(this.stationsList.firstChild);
    }

    if (stationIds.length) {
      this.stationsList.append(localStations);
    }
    this.curatedItems.forEach(item => this.addCarouselItem(item));

    // Store for stations centering when stations do not fill up page
    this.stationsNodes = this.stationsCarousel.querySelectorAll('li');
    // Store for image resizing when window width is medium or smaller
    this.stationsNodes.thumbs = this.stationsCarousel.querySelectorAll('.thumb');
  }

  /**
   * Initial function - retrieve new payload of stations into DOM and enable navigation
   * @function
   * @returns {Promise}
   */
  async updateStations() {
    this.marketID = await market.getID();
    return this.getFilteredStationsFromApi().then(async (stationsData) => {
      if (!stationsData.count && !this.curatedItems.length) {
        this.hideStationCarousel();
        return;
      }
      this.stationsData = stationsData;
      await this.updateStationsDOM();
      this.setImageAndPageDims();
      this.setCarouselWidth();
      this.totalPages = Math.ceil(this.stationsData.count / this.pageSize);
      this.hideOrShowEndArrows();
      this.centerPageResults();
      if (this.windowWidth < this.windowSizes.medium) {
        this.createPaginationDots();
      }
      this.hammerTime.on('swipeleft', function (e) {
        this.getPage(e, this);
      }.bind(this));
      this.hammerTime.on('swiperight', function (e) {
        this.getPage(e, this);
      }.bind(this));
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
  }
}

module.exports = el => new StationsCarousel(el);
