'use strict';

const
  _get = require('lodash/get'),
  db = require('../../server/db'),
  logger = require('../../universal/log'),
  { retrieveList, saveList } = require('../../server/lists'),
  { subscribe } = require('amphora-search'),

  __ =  {
    db,
    getRef: page => _get(page, 'data.main[0]', '').replace('@published', ''),
    getStationData: page => __.db.get(__.getRef(page)),
    handlePublishStationFront,
    listNames: stationSlug => ['primary', 'secondary'].map(name => `${stationSlug}-${name}-section-fronts`),
    log: logger.setup({ file: __filename }),
    onlyStationFronts: page =>  _get(page, 'data.main[0]', '').includes('/_components/station-front/instances/'),
    publishStationFront: stream =>
      stream.filter(__.onlyStationFronts).each(__.handlePublishStationFront),
    retrieveList,
    saveList,
    subscribe
  };

/**
 * Upon publish, ensure new station front primary and secondary section fronts lists exist
 * e.g. some-station-primary-section-fronts and some-station-secondary-section-fronts
 * _lists instance if it they do not already exist.
 * @param {page} page - publish page event payload
 **/
async function handlePublishStationFront(page) {
  try {
    const options = { host: page.uri.split('/')[0] },
      { stationSlug } = await __.getStationData(page);

    await Promise.all(
      __.listNames(stationSlug)
        .map(name => ({ name, data: __.retrieveList(name, options) }))
        .map(async ({ name, data }) => __.saveList(name, await data, options))
    );
  } catch (e) {
    __.log('error', e);
  }
}


/**
 * subscribe to event bus messages
 */
function subscriber() {
  __.subscribe('publishPage').through(__.publishStationFront);
}
subscriber._internals = __;

module.exports = subscriber;
