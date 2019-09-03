'use strict';

const { getComponentName } = require('clayutils'),
  log = require('../../universal/log').setup({
    file: __filename
  }),
  { PAGE_TYPES } = require('../../universal/constants'),
  urlExists = require('../../universal/url-exists'),
  componentTypesToValidate = {
    [PAGE_TYPES.ARTICLE]: true,
    [PAGE_TYPES.GALLERY]: true
  },
  isSlugChanged = (state, data) => {
    const {
        page: {
          state: { url: pageUrl }
        }
      } = state,
      publishedSlug = pageUrl.split('/').slice(-1)[0];

    return publishedSlug !== data.slug;
  };

module.exports = {
  label: 'Duplicate Slug',
  description: 'This slug has already been published.',
  type: 'error',
  async validate(state) {
    /**
     * @param {Array[]} objectEntry
     * @returns {Promise <object>} validationErrors
     */
    const validateSlug = async ([uri, data]) => {
        const componentName = getComponentName(uri);

        try {
          const res = await urlExists(uri, data, state.locals, componentName),
            isDuplicate = !!res,
            isInvalidSlug = isDuplicate && isSlugChanged(state, data);

          if (isInvalidSlug) {
            return {
              uri,
              location: `${componentName} » slug`,
              field: 'slug',
              preview: data.slug
            };
          }
        } catch (e) {
          log('error', 'problem validating slug', e);
        }
      },
      errors = (
        await Promise.all(
          Object.entries(state.components)
            .filter(([uri]) => componentTypesToValidate[getComponentName(uri)])
            .map(validateSlug)
        )
      ).filter(validationFailure => validationFailure);

    return errors;
  }
};
