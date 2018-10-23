'use strict';
const rest = require('../../services/universal/rest'),
  db = require('../../services/server/db'),
  radioApi = 'https://api.radio.com/v1/';

function getStationsByFilter(filterStationsBy, filterByValue) {
  // Get stations from redis cache
  return db.get(`stations_filterBy_${filterStationsBy}_${filterByValue}`)
    .then(stationsData => {
      // Update data if older than 5 minutes
      if (stationsData.dateUpdated < Date.now() - 6 * 1000) {
        return updateStationsObject(filterStationsBy, filterByValue, stationsData).then(newData => {
          console.log('get updated stations from api: ', newData.data);
          return newData.data;
        });
      } else {
        console.log('get stored stations from redis: ', stationsData.data);
        return stationsData.data;
      }
    }).catch(() => {
      // No stations found in redis so get from API
      return updateStationsObject(filterStationsBy, filterByValue);
    });
}

function getFilteredStationsFromApi(filterStationsBy, filterByValue) {
  let params = '?sort=-popularity';

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
        })
      };

      // Store stations in redis cache
      db.put(`stations_filterBy_${filterStationsBy}_${filterByValue}`, JSON.stringify(newData));
      return newData.data;
    } else {
      return Promise.reject();
    }
  });
}

function updateStationsObject(filterStationsBy, filterByValue, stationsData) {
  // If stations object exists, update the timestamp so we dont make multiple API requests
  if (stationsData) {
    db.put(`stations_filterBy_${filterStationsBy}_${filterByValue}`, JSON.stringify(stationsData)).then(() => {
      return getFilteredStationsFromApi(filterStationsBy, filterByValue);
    });
  } else {
    return getFilteredStationsFromApi(filterStationsBy, filterByValue);
  }
}

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = (ref, data, locals) => {
  if (data.stations && !data.stations.length || !locals) {
    return data;
  }
  switch (data.filterStationsBy) {
    case 'market':
      data.title = 'stations near you';
      break;
    case 'section-front':
      if (data.sectionFront == 'entertainment') {
        data.title = 'music stations near you';
      } else {
        data.title = `${data.sectionFront} stations near you`;
      }
      break;
    case 'genre':
      data.title = `${data.genre} stations near you`;
      break;
    default:
  }
  if (data.overrideTitle) data.title = data.overrideTitle;
  console.log("return data in save:", data);
  return data;
};

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = function (ref, data, locals) {
  console.log('ref: ', ref, 'data: ', data, 'locals: ', locals);
  let filterByValue;

  switch (data.filterStationsBy) {
    case 'section-front':
      filterByValue = data.sectionFront;
      if (data.sectionFront == 'entertainment') filterByValue = 'music';
      break;
    case 'genre':
      filterByValue = data.genre;
      break;
    default:
  }
  return getStationsByFilter(data.filterStationsBy, filterByValue).then(stationsData => {
    data.stations = stationsData;
    console.log("return stations in render:", data.stations);
    return data;
  }).catch((e) => {
    console.log("Render error: ", e);
  });
};
