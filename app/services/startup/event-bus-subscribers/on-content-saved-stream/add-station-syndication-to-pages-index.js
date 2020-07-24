'use strict';

const _get = require('lodash/get'),
  axios = require('axios'),
  formatPossibleAxiosError = require('../../../universal/format-possible-axios-error'),
  log = require('../../../universal/log').setup({ file: __filename }),
  { contentTypes: badContentTypes } = require('../../../universal/constants'),
  { filters } = require('amphora-search'),
  {
    getComponentName,
    isPublished,
    replaceVersion: stripVersion
  } = require('clayutils');

const { isPageOp } = filters,
  // hopefully we can fix constants -> contentTypes in the future and use
  //   that instead
  contentTypes = new Set(badContentTypes);

contentTypes.delete('latest-videos');
contentTypes.delete('more-content-feed');

/**
 * adds the 'stationSyndication' property onto the pages index when a content
 *   page is published
 *
 * @param {object[]} ops
 */
async function addStationSyndicationToPagesIndex(ops) {
  try {
    const contentData = JSON.parse(_get(ops.find(isContentOp), 'value', '{}')),
      pageId = _get(ops.find(isPageOp), 'key', ''),
      wasContentPagePublished = contentData && pageId && isPublished(pageId);

    if (!wasContentPagePublished) {
      return;
    }

    const updatePageUrl = getUpdatePageUrl(pageId),
      { stationSyndication = [] } = contentData;

    await axios.post(updatePageUrl, {
      doc: { stationSyndication },
      doc_as_upsert: true
    });
  } catch (err) {
    log(
      'error',
      'Error when adding station syndication to the pages index',
      formatPossibleAxiosError(err)
    );
  }
};

function isContentOp(op) {
  return contentTypes.has(getComponentName(op.key));
}

function getUpdatePageUrl(pageId) {
  const esId = encodeURIComponent(stripVersion(pageId));

  return `${process.env.ELASTIC_HOST}/pages/_doc/${esId}/_update`;
}

module.exports = addStationSyndicationToPagesIndex;
