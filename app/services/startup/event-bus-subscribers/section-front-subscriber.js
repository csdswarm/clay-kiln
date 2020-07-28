'use strict';

const
  _get = require('lodash/get'),
  db = require('../../server/db'),
  { deleteListItem, updateListItem } = require('../../server/lists'),
  { subscribe } = require('amphora-search'),
  { postfix } = require('../../universal/utils'),

  log = require('../../universal/log').setup({ file: __filename }),

  onlySectionFronts = page => _get(page, 'data.main[0]', '').includes('/_components/section-front/instances/'),
  listName = (station, { primary }) => `${postfix(station, '-')}${primary ? 'primary' : 'secondary'}-section-fronts`,
  publishSectionFront = stream => stream.filter(onlySectionFronts).each(handlePublishSectionFront),
  unpublishSectionFront = stream => stream.filter(onlySectionFronts).each(handleUnpublishSectionFront),
  updateTitleLock = (ref, data, titleLocked) => db.put(ref, JSON.stringify({ ...data, titleLocked }));

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
      sectionFrontRef = _get(page, 'data.main[0]', '').replace('@published', ''),
      data = await db.get(sectionFrontRef),
      { stationSlug, title, titleLocked } = data;

    if (title && !titleLocked) {
      const
        sectionFront = { name: title, value: title.toLowerCase() },
        addedItem = await updateListItem(listName(stationSlug, data), sectionFront, 'name', { host });

      if (addedItem === sectionFront) {
        await updateTitleLock(sectionFrontRef, data, true);
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
      sectionFrontRef = _get(page, 'data.main[0]', ''),
      data = await db.get(sectionFrontRef),
      { stationSlug, title } = data;

    if (title) {
      const titleVal = title.toLowerCase();

      await deleteListItem(listName(stationSlug, data), ({ value }) => value === titleVal, { host });
      await updateTitleLock(sectionFrontRef, data, false);
    }
  } catch (e) {
    log('error', e);
  }
}

/**
 * subscribe to event bus messages
 */
module.exports = () => {
  subscribe('publishPage').through(publishSectionFront);
  subscribe('unpublishPage').through(unpublishSectionFront);
};
