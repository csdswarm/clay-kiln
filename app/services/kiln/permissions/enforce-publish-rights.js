'use strict';

const whenRightDrawerExists = require('../when-right-drawer-exists'),
  { whenPreloaded } = require('./utils');

const KilnInput = window.kiln.kilnInput;

/**
 * hides the 'publish' or 'unpublish' button if the user does not
 *   have permissions
 *
 * @param {object} schema
 * @param {object} opts
 * @param {boolean} opts.checkStationAccess - determines whether this method should
 *   only enforce publish rights based off station access.  This makes sense
 *   for content types which allow all roles to publish such as article
 *   and gallery.
 **/
function enforcePublishRights(schema, { checkStationAccessFor }) {
  const { schemaName } = schema,
    kilnInput = new KilnInput(schema),
    whenPreloadedPromise = whenPreloaded(kilnInput);

  whenRightDrawerExists(kilnInput, async rightDrawerEl => {
    const { locals } = await whenPreloadedPromise,
      { site_slug } = locals.stationForPermissions,
      hasAccess = !!locals.stationsIHaveAccessTo[site_slug],
      canPublish = checkStationAccessFor.publish
        ? hasAccess
        : locals.user.can('publish').a(schemaName).value,
      canUnpublish = checkStationAccessFor.unpublish
        ? hasAccess
        : locals.user.can('unpublish').a(schemaName).value;

    if (canPublish && canUnpublish) {
      return;
    }

    // shouldn't be declared above the short circuit
    // eslint-disable-next-line one-var
    const publishBtn = rightDrawerEl.querySelector('.publish-actions > button'),
      unpublishBtn = rightDrawerEl.querySelector('.publish-status > button');

    if (!canPublish && publishBtn) {
      publishBtn.style.display = 'none';
    }
    if (!canUnpublish && unpublishBtn) {
      unpublishBtn.style.display = 'none';
    }
  });
}

module.exports = enforcePublishRights;
