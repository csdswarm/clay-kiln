'use strict';

const { claycli } = require('./base');

/**
 * Exports objects from clay
 * @param {Object} params
 * @param {Object} params.componentUrl the url of the component to export
 * @param {bool} [params.asJson] default is false. If true, returns data as a JSON string, exactly as it came from claycli
 *                               otherwise it coerces it into a js object that can be converted to the type
 *                               of yaml that claycli will accept
 * @returns {Promise<(string | Object)>}
 */
function clayExport_v1(params) {
  const { componentUrl, asJSON = false } = params;
  console.log(`Retrieving: ${componentUrl}`);

  return new Promise((resolve, reject) => {
    try {
      const res = claycli.export.fromURL(componentUrl);
      let data = asJSON ? [] : {};

      res.on('data', d => {
        if (asJSON) {
          data.push(d);
        } else {
          Object.entries(d)
            .forEach(([key, value]) => {
              const props = key.split('/').slice(1);
              const lastProp = props.splice(-1, 1)[0];
              let current = data;
              props
                .forEach(prop => {
                  current[prop] = current[prop] || {};
                  current = current[prop];
                });
              current[lastProp] = value;
            });
        }
      });

      res.on('end', () => {
        if (asJSON) {
          resolve({ result: 'success', data: data.join('\n') });
        } else {
          resolve({ result: 'success', data });
        }
      });

      res.on('error', error => reject({ result: 'fail', params, error }));
    } catch (error) {
      reject({ result: 'fail', params, error });
    }
  });
}


module.exports = {
  v1: clayExport_v1
};
