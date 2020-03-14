'use strict';

const { bluebird } = require('./base');
const clayExport = require('./clay-export').v1;
const clayImport = require('./clay-import').v1;
const { _get, clayutils } = require('./base');

const { isPage } = clayutils;

/**
 * Helper for adding a component to a component list of multiple layout or page instances
 *
 * @param {string} host - The Clay host
 * @param {string[]} containerRefs - Array of absolute refs of the layout/page instances to add to (minus host)
 * @param {string} componentRef - Absolute ref of the component to add (minus host)
 * @param {string} componentList - The component list to add the component to
 * @param {function} [mutationCallback] - Optionally mutate the container's data before it gets re-imported.
 * @returns Promise<void>
 */
async function addComponentToContainers_v1(host, containerRefs, componentRef, componentList, mutationCallback){
  // fetch all containers
  const containers = await bluebird.map(
    containerRefs,
    ref => clayExport({componentUrl: `${host}/${ref}`}).then(data => [ref, data]),
    { concurrency: 2 }
  );

  // add our component references
  const payloads = containers.map(([ref, container]) => {
    if(container.result === 'success'){
      const url = `${host}/${ref}`;
      console.log(`Retrieved ${url}`);

      const path = ref.split('/'),
        data = _get(container.data, path),
        target = _get(data, componentList);

      if (Array.isArray(target)) {
        const componentPath = `/${componentRef}`,
          existingRef = target.find(ref => ref === componentPath || ref._ref === componentPath);

        // only add it if it doesn't already exist
        if (!existingRef) {
          target.push(isPage(url) ? componentPath : {
            _ref: componentPath
          });

          if (mutationCallback) {
            mutationCallback(ref, data);
          }

          console.log(`Added ${componentRef} to "${componentList}" for ${url}`);

          return container.data;
        } else {
          console.error(`Component already exists in "${componentList}" for ${url}`);
        }
      } else if (!target) {
        console.error(`Couldn't find component list "${componentList}" for ${url}`);
      } else {
        console.error(`Component list "${componentList}" exists, but is not an array for ${url}`);
      }
    }else{
      console.error(`Couldn't retrieve ${host}/${ref}`);
    }
  }).filter(Boolean);

  // import all containers
  await bluebird.map(
    payloads,
    payload => clayImport({
      payload,
      hostUrl: host,
      publish: true
    }),
    { concurrency: 2 }
  );
}

module.exports = {
  v1: addComponentToContainers_v1
};
