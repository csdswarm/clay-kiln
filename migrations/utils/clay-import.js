'use strict';
const { _get, claycli, toYaml } = require('./base');

/**
 * Imports objects (_components/_pages/_layouts/_lists) into clay
 * @param {Object} params
 * @param {string} params.hostUrl The target url where clay is running
 * @param {(Object|string)} params.payload The data to import into clay (string represents yaml data)
 * @param {boolean} [params.publish] Whether or not the data should be published. default is false
 * @param {string} [params.key] the key to connect to the host with. default is 'demo'
 * @returns {Promise<{result: ('success'|'fail'), params: Object, messages?: Object[], error?: Object}>}
 */
function clayImport_v1(params) {
  let { hostUrl, payload, publish = false, key = 'demo' } = params;
  console.log(`Saving: to: ${hostUrl}`);
  return new Promise((resolve, reject) => {
    try {
      const fromObject = typeof payload === 'object';
      const yaml = true;
      const data = fromObject ? toYaml(payload) : payload;
      let messages = [];

      const options = { key, publish, yaml };
      let res = claycli.import(data, hostUrl, options);

      res.on('data', d => {
        if (_get(d, 'type') === 'error') {
          reject({ result: 'fail', params, error: d })
        } else {
          messages.push(d)
        }
      });
      res.on('end', () => {
        resolve({ result: 'success', messages, params });
      });
      res.on('error', error => reject({ result: 'fail', params, error }))
    } catch (error) {
      reject({ result: 'fail', params, error });
    }
  });
}

module.exports = {
  v1: clayImport_v1
};
