'use strict';

const { subscribe } = require('amphora-search'),
  db = require('../../server/db'),
  log = require('../../universal/log').setup({ file: __filename }),
  redis = require('../../server/redis'),
  primarySectionFrontsList = '/_lists/primary-section-fronts',
  secondarySectionFrontsList = '/_lists/secondary-section-fronts';

/**
 * @param {Object} stream - publish page event payload
 */
function publishPage(stream) {
  stream
    .filter( filterNonSectionFront )
    .each( handlePublishSectionFront );
}

/**
 * @param {Object} stream - unpublish page event payload
 */
function unpublishPage(stream) {
  stream
    .each( handleUnpublishSectionFront );
}

/**
 * @param {Object} page - publish page event payload
 * @returns {boolean}
 */
function filterNonSectionFront(page) {
  return page.data && page.data.main && page.data.main[0].includes('/_components/section-front/instances/');
}

/**
 * Upon publish, add new section front title to primary or secondary
 * section front _lists instance if it does not already exist.
 * Note: Locks title field to prevent breaking article breadcrumbs
 * when a section front title is changed
 * @param {page} page - publish page event payload
 **/
async function handlePublishSectionFront(page) {
  try {
    const host = page.uri.split('/')[0],
      sectionFrontRef = page.data.main[0].replace('@published',''),
      data = await db.get(sectionFrontRef),
      sectionFrontsList = data.primary ? primarySectionFrontsList : secondarySectionFrontsList;

    if (data.title && !data.titleLocked) {
      const sectionFronts = await db.get(`${host}${sectionFrontsList}`),
        sectionFrontValues = sectionFronts.map(sectionFront => sectionFront.value);

      if (!sectionFrontValues.includes(data.title.toLowerCase())) {
        sectionFronts.push({
          name: data.title,
          value: data.title.toLowerCase()
        });
        await db.put(`${host}${sectionFrontsList}`, JSON.stringify(sectionFronts));
        await db.put(sectionFrontRef, JSON.stringify({ ...data, titleLocked: true }));

        // delete list from cache
        redis.del(`list:${sectionFrontsList.replace('/_lists/', '')}`);
      }
    }
  } catch (e) {
    log('error', e);
  }
}

/**
 * Upon unpublish, remove section front title from primary or secondary
 * section front _lists instance if it exists.
 * Note: Unlocks title field
 * @param {Object} page - unpublish page event payload
 */
async function handleUnpublishSectionFront(page) {
  try {
    const host = page.uri.split('/')[0],
      pageData = await db.get(page.uri),
      mainRef = pageData.main[0];

    if (mainRef.includes('/_components/section-front/instances/')) {
      const data = await db.get(mainRef),
        sectionFrontsList = data.primary ? primarySectionFrontsList : secondarySectionFrontsList;

      if (data.title) {
        const sectionFronts = await db.get(`${host}${sectionFrontsList}`),
          updatedSectionFronts = sectionFronts.filter(sectionFront => {
            return sectionFront.value !== data.title.toLowerCase();
          });

        await db.put(`${host}${sectionFrontsList}`, JSON.stringify(updatedSectionFronts));
        await db.put(mainRef, JSON.stringify({ ...data, titleLocked: false }));
      }
    }
  } catch (e) {
    log('error', e);
  }
}

/**
 * subscribe to event bus messages
 */
module.exports = () => {
  subscribe('publishPage').through(publishPage);
  subscribe('unpublishPage').through(unpublishPage);
};
