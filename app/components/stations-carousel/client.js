'use strict';
const db = require('../../services/client/db'),
  rest = require('../../services/universal/rest'),
  radioApi = 'https://api.radio.com/v1/',
  geoApi = 'https://geo.radio.com/markets',
  localStorage = window.localStorage;

function Constructor() {
  console.log("stations carousel client js works");
  const stationsCarousel = document.querySelector('.component--stations-carousel'),
    filterStationsBy = stationsCarousel.getAttribute('data-filter-stations-by-track'),
    genre = stationsCarousel.getAttribute('data-genre-track'),
    sectionFront = stationsCarousel.getAttribute('data-section-front-track'),
    windowWidth = window.outerWidth,
    paginationDots = document.querySelector('.carousel__pagination-dots'),
    leftArrow = document.querySelector('.stations-carousel__arrow--left'),
    rightArrow = document.querySelector('.stations-carousel__arrow--right');

  let marketID = localStorage.getItem('marketID'),
    pageSize = 300,
    pageNum = 1;

  if (windowWidth <= 1023) {
    if (windowWidth >= 481) {
      pageSize = 3;
    } else if (windowWidth >= 361) {
      pageSize = 2;
    }
  }

  switch (filterStationsBy) {
    case 'section-front':
      filterByValue = sectionFront;
      if (sectionFront == 'entertainment') filterByValue = 'music';
      break;
    case 'genre':
      filterByValue = genre;
      break;
    default:
  }

  stationsCarousel.setAttribute('style',`
    width: ${document.body.clientWidth}px;
    margin-left: calc((${document.body.clientWidth}px - 1100px) / -2);
  `);
  this.updateStations(filterStationsBy, filterValue, pageSize, pageNum);
  leftArrow.addEventListener('click', this.getPrevStation);
  rightArrow.addEventListener('click', this.getNextStation);
}

Constructor.prototype = {
  getPrevStation: function () {

  },
  getNextStation: function () {
    // transform: translateX(-160px);
  },
  createPaginationDots: function () {
    for (let page = 1; page <= this.totalPages; page++) {
      let dot = document.createElement('div');
      dot.setAttribute('class', 'pagination-dots__dot');
      dot.setAttribute('data-page', page);
      dot.addEventListener('click', this.getPage);
      paginationDots.appendChild(dot);
    }
  },
  getPage: function (event) {
    this.pageNum = event.currentTarget.getAttribute('data-page');
    this.updateStations(this.filterStationsBy, this.filterValue, this.pageSize, this.pageNum);
  },
  /**
   * Get user's local market ID with geo api & set in browser storage
   * @function
   */
  getMarket: function () {
    if (!marketID) {
      return rest.get(geoApi).then(marketData => {
        if (marketData.Markets) {
          console.log("updated market in client:", marketData);
          localStorage.setItem('marketID', marketData.Markets[0].id);
          return marketData.Markets[0].id;
        } else {
          return Promise.reject();
        }
      });
    } else {
      return marketID;
    }
  },
  updateStations: function (filterStationsBy, filterValue, pageSize, pageNum) {
    return this.getMarket().then(marketID => {
      return this.getStationsByFilter(filterStationsBy, marketID, filterValue, pageSize, pageNum).then(stationsData => {
        console.log("updated stations in client:", stationsData);
        this.totalPages = stationsData.count / pageSize;
        if (windowWidth <= 1023) this.createPaginationDots();
        return stationsData.data;
      }).catch((e) => {
        console.log("Update query error: ", e);
        return [];
      });
    }).catch(e => {
      console.log("Market query error: ", e);
      return [];
    });
  },
  getStationsByFilter: function (filterStationsBy, marketID, filterByValue, pageSize, pageNum) {
    // Get stations from redis cache
    return db.get(`stations_filterBy_${filterStationsBy}_${filterByValue}_marketID_${marketID}`)
      .then(stationsData => {
        // Update data if older than 5 minutes
        if (stationsData.dateUpdated < Date.now() - 6 * 1000) {
          return this.updateStationsObject(filterStationsBy, marketID, filterByValue, pageSize, pageNum, stationsData).then(newData => {
            console.log('get updated stations from api: ', newData.data);
            return newData;
          });
        } else {
          console.log('get stored stations from redis: ', stationsData.data);
          return stationsData;
        }
      }).catch(() => {
        // No stations found in redis so get from API
        return this.updateStationsObject(filterStationsBy, marketID, filterByValue, pageSize, pageNum);
      });
  },
  getFilteredStationsFromApi: function (filterStationsBy, marketID, filterByValue, pageSize, pageNum) {
    let params = `?sort=-popularity&filter[market_id]=${marketID}`;

    if (pageSize) {
      params += `&page[size]=${pageSize}`
    } else {
      params += '&page[size]=300'
    }

    if (pageNum) {
      params += `&page[number]=${pageNum}`
    } else {
      params += '&page[number]=1'
    }

    switch (filterStationsBy) {
      case 'section-front':
        params += `&filter[category]=${filterByValue}`;
        break;
      case 'genre':
        params += `&filter[genre_id]=${filterByValue}`;
        break;
      default:
    }
    console.log("params: ", params);
    return rest.get(`${radioApi}stations${params}`).then(response => {
      if (response.data) {
        let newData = {
          dateUpdated: Date.now(),
          data: response.data.map(station => {
            return station.attributes;
          }),
          count: response.meta.count
        };

        // Store stations in redis cache
        db.put(`stations_filterBy_${filterStationsBy}_${filterByValue}_marketID_${marketID}`, JSON.stringify(newData));
        return newData;
      } else {
        return Promise.reject();
      }
    });
  },
  updateStationsObject: function (filterStationsBy, marketID, filterByValue, pageSize, pageNum, stationsData) {
    // If stations object exists, update the timestamp so we dont make multiple API requests
    if (stationsData) {
      db.put(`stations_filterBy_${filterStationsBy}_${filterByValue}_marketID_${marketID}`, JSON.stringify(stationsData)).then(() =>
      {
        return this.getFilteredStationsFromApi(filterStationsBy, marketID, filterByValue, pageSize, pageNum);
      });
    } else {
      return this.getFilteredStationsFromApi(filterStationsBy, marketID, filterByValue, pageSize, pageNum);
    }
  }
};

module.exports = () => new Constructor();
