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
  },
  findComponentToValidate = components => Object.entries(components)
    .find(([uri]) => componentTypesToValidate[getComponentName(uri)]);

module.exports = {
  label: 'Duplicate Slug',
  description: 'This slug has already been published.',
  type: 'error',
  async validate(state) {
    /**
     * validates the slug field of the component by checking for a duplicate slug
     * @param {Array[]} objectEntry
     * @returns {Promise <object>} validationErrors
     */
    const validateSlug = async ([uri, data]) => {
        const componentName = getComponentName(uri);

        if (isSlugChanged(state, data)) {
          try {
            const res = await urlExists(uri, data, state.locals, componentName),
              urlAlreadyPublished = !!res;

            if (urlAlreadyPublished) {
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
        }
      },
      validationError = await validateSlug(
        findComponentToValidate(state.components)
      );

    return validationError ? [validationError] : [];
  }
};
