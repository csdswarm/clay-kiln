'use strict';

const _reduce = require('lodash/reduce'),
  _some = require('lodash/some'),
  _find = require('lodash/find'),
  _includes = require('lodash/includes'),
  _startCase = require('lodash/startCase'),
  helpers = require('./helpers'),
  restrictedFields = {
    'mediaplay-image': 'rendition'
  }, // list of image components to validate, and their `rendition` field
  ledes = [
    'lede-feature',
    'lede-feature-cathy-horyn',
    'lede-full-bleed',
    'lede-video'
  ], // list of feature lede components. add to this list if you create a new lede!
  restrictedRenditions = {
    'flex-small': ['feature', 'one-column'],
    'flex-large': ['one-column'],
    'full-bleed': ['one-column'],
    // note: remove this (and update test) if we ever add a feature rendition that is NOT available in one-column layouts
    'test-feature-only': ['feature']
  }; // list of renditions and where they're available
  // note: renditions are formatted like this in case we want to allow certain renditions
  // only in features, rather than allowing anything in features to be used in one-column layouts

module.exports = {
  label: 'Renditions',
  description: 'This type of page prohibits some mediaplay image renditions',
  type: 'error',
  validate(state) {
    const hasOneColumnLayout = _some(state.components, (component, uri) => helpers.getComponentName(uri) === 'one-column-layout'),
      hasFeatureLede = _some(state.components, (component, uri) => _includes(ledes, helpers.getComponentName(uri)));

    return _reduce(state.components, function (errors, component, uri) {
      const field = _find(restrictedFields, (val, key) => key === helpers.getComponentName(uri)),
        restricted = _find(restrictedRenditions, (val, key) => component && component[field] == key);

      if (field && restricted) {
        // it's a type of component we care about, and a rendition that's restricted!
        const isAllowedInOneColumn = _includes(restricted, 'one-column'),
          isAllowedInFeature = _includes(restricted, 'feature'),
          isAllowedInBoth = isAllowedInOneColumn && isAllowedInFeature;

        if (isAllowedInBoth && !hasOneColumnLayout && !hasFeatureLede) {
          // rendition is allowed in both, but we're in neither
          errors.push({
            uri,
            field,
            location: `${helpers.labelUtil(helpers.getComponentName(uri))}`,
            preview: `${_startCase(component[field])} rendition only allowed in one-column layouts or feature pages`
          });
        } else if (!isAllowedInFeature && isAllowedInOneColumn && !hasOneColumnLayout) {
          // rendition is restricted to one-column layout, and we're not in one of those
          errors.push({
            uri,
            field,
            location: `${helpers.labelUtil(helpers.getComponentName(uri))}`,
            preview: `${_startCase(component[field])} rendition only allowed in one-column layouts`
          });
        } else if (!isAllowedInOneColumn && isAllowedInFeature && !hasFeatureLede) {
          // rendition is restricted to features, and we don't have a feature lede
          errors.push({
            uri,
            field,
            location: `${helpers.labelUtil(helpers.getComponentName(uri))}`,
            preview: `${_startCase(component[field])} rendition only allowed in feature pages`
          });
        }
      }
      return errors;
    }, []);
  }
};
