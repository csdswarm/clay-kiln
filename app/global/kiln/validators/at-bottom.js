'use strict';

const _reduceRight = require('lodash/reduceRight'),
  _findIndex = require('lodash/findIndex'),
  _filter = require('lodash/filter'),
  _map = require('lodash/map'),
  helpers = require('./helpers'),
  shouldBeAtBottom = [ // ordered array of components at the bottom
    'single-related-story', // penultimate
    'annotations' // last
  ];

module.exports = {
  label: 'Bottom Components',
  description: 'Certain components must be at the bottom of the article',
  type: 'error',
  validate(state) {
    const article = helpers.findArticle(state.components),
      content = article && article.content,
      length = content && content.length;

    let previousMatches = [];

    if (length) {
      return _reduceRight(content, (errors, component, index) => {
        const uri = component[helpers.refProp],
          name = helpers.getComponentName(component[helpers.refProp]),
          matchedIndex = _findIndex(shouldBeAtBottom, (n) => n === name), // find the index of the matched name in the shouldBeAtBottom array
          shouldComeAfterMatchedIndexes = _filter(previousMatches, (i) => i < matchedIndex),
          mustBeAtBottom = matchedIndex > -1,
          isNotAtEnd = index < length - 1 - previousMatches.length,
          isOutOfOrder = shouldComeAfterMatchedIndexes.length > 0;

        if (mustBeAtBottom) {
          // this is a component that's in the shouldBeAtBottom array
          if (isNotAtEnd) {
            // component should be at the end of the article content, but isn't
            errors.push({
              uri,
              // no field, since we can't focus on component lists
              location: `${helpers.labelUtil(name)}`,
              preview: 'Must be at the bottom of the article.'
            });
          } else if (isOutOfOrder) {
            // component should come before a certain other one, but it isn't
            errors.push({
              uri,
              // no field, since we can't focus on component lists
              location: `${helpers.labelUtil(name)}`,
              preview: `Must be at the bottom of the article, and below ${_map(shouldComeAfterMatchedIndexes, (i) => helpers.labelUtil(shouldBeAtBottom[i])).join(', ')}.`
            });
          }
          previousMatches.push(matchedIndex); // record the match
        }
        return errors;
      }, []);
    }
  }
};
