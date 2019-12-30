'use strict';

const axios = require('axios'),
  checkError = error => {
    console.error(error);
  },
  checkStatus = res => {
    if (res.status && res.status >= 200 && res.status < 400) {
      console.log({ res });
      return res;
    } else {
      const error = new Error(res.statusText);

      error.response = res;
      throw error;
    }
  };

module.exports = (url, data) => {
  return axios({
    method: 'post',
    url,
    data,
    withCredentials: true
  })
    .then(checkStatus)
    .catch(checkError);
};
