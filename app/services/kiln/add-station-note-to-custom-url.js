'use strict';

const whenRightDrawerExists = require('./when-right-drawer-exists'),
  /**
   * Creates the description span which will be inserted into the kiln drawer
   *
   * @param {string} stationSlug
   * @returns {Element}
   */
  createDescriptionSpan = stationSlug => {
    const stationDescription = document.createElement('span'),
      text = document.createTextNode(`This url will live under /${stationSlug}/`);

    stationDescription.appendChild(text);

    stationDescription.classList.add('location-description', 'station-note');

    return stationDescription;
  };

/**
 * Adds a note to the 'custom url' drawer section which hints to users their url
 *   will be prepended with the station slug.  This note does not appear if a
 *   custom url is already present.
 *
 * @param {object} kilnInput
 */
module.exports = kilnInput => {
  whenRightDrawerExists(kilnInput, rightDrawerEl => {
    //
    // for each content type there should only ever exist one component on
    //   the page.
    //
    // schemaName = article | gallery | static-page | ect...
    //
    const contentEl = document.querySelector(`.component--${kilnInput.schemaName}`),
      { stationSlug } = contentEl.dataset,
      customUrl = rightDrawerEl.querySelector('.publish-location-form input').value;

    // we only need to show the the station note if there's a station slug and
    //   a custom url doesn't already exist.
    if (!stationSlug || customUrl) {
      return;
    }

    // this shouldn't be declared above the short-circuit
    // eslint-disable-next-line one-var
    const locationDescription = rightDrawerEl.querySelector('.publish-location-form > .location-description'),
      stationDescription = createDescriptionSpan(stationSlug);

    locationDescription.insertAdjacentElement('afterend', stationDescription);
  });
};
