'use strict';

const _get = require('lodash/get'),
  brandingRubricHandlers = [
    { when: isSponsored, handler: sponsoredRubric },
    { when: isDailyIntelligencer, handler: dailyIntelligencerGraphicBrandingRubric },
    { when: isSwellness, handler: swellnessGraphicBrandingRubric },
    { when: isBestOfNewYork, handler: bestOfNewYorkGraphicBrandingRubric }
  ];

function isSponsored(data) {
  return data.featureTypes && data.featureTypes['Sponsor Story'];
}

function isDailyIntelligencer(data, locals) {
  return _get(locals, 'site.slug') === 'di';
}

function isSwellness(data, locals) {
  return _get(locals, 'site.slug') === 'thecut' && data.section === 'swellness';
}

function isBestOfNewYork(data, locals) {
  return _get(locals, 'site.slug') === 'grubstreet' && data.section === 'bestofnewyork';
}

/**
 * Sets the graphical rubric for the Best of New York pop-up.
 * We also want to hide the tag rubric for Best of New York
 * @param {object} data
 */
function sponsoredRubric(data) {
  data.sponsoredRubric = true;
  data.rubric = undefined; // hide the tag rubric when sponsored
}

/**
 * Sets the graphical rubric for DI
* @param {object} data
 */
function dailyIntelligencerGraphicBrandingRubric(data) {
  data.graphicBrandingRubric = 'di';
  data.graphicBrandingRubricMediaPath = 'public/media/sites/di/di-feature-rubric.svg';
  // di keeps its tag rubric
}

/**
 * Sets the graphical rubric for the Swellness pop-up.
 * We also want to hide the tag rubric for Swellness
 * @param {object} data
 */
function swellnessGraphicBrandingRubric(data) {
  data.graphicBrandingRubric = 'swellness';
  data.graphicBrandingRubricMediaPath = 'public/media/sites/thecut/swellness-feature-rubric.svg';
  data.rubric = undefined; // hide the tag rubric on Swellness
}

/**
 * Sets the graphical rubric for the Best of New York pop-up.
 * We also want to hide the tag rubric for Best of New York
 * @param {object} data
 */
function bestOfNewYorkGraphicBrandingRubric(data) {
  data.graphicBrandingRubric = 'Best of New York';
  data.graphicBrandingRubricMediaPath = 'public/media/sites/grubstreet/bony-feature-rubric.svg';
  data.rubric = undefined; // hide the tag rubric on Best of New York
}

module.exports = brandingRubricHandlers;
