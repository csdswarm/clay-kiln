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
  /**
   * determines whether the slug has changed by comparing the current
   * page state with the published component's data
   *
   * @param {Object} state
   * @param {Object} data
   * @returns {Boolean}
   */
  isSlugChanged = (state, data) => {
    const pageUrl = state.page.state.url;

    if (!pageUrl) {
      return false;
    }

    const publishedSlug = pageUrl.split('/').slice(-1)[0];

    return publishedSlug !== data.slug;
  },
  /**
   * Looks for the first component that has a type requiring validation.
   * If it doesn't exist, then we can safely assume no validation is necessary.
   *
   * @param {Array} components
   * @returns {Object|undefined} component
   */
  findComponentRequiringValidation = components => Object.entries(components)
    .find(([uri]) => componentTypesToValidate[getComponentName(uri)]);

module.exports = {
  label: 'Duplicate Slug',
  description: 'This slug has already been published.',
  type: 'error',
  async validate(state) {
    /**
     * validates the slug field of the component by checking for a duplicate slug
     * @param {Array[]} components
     * @returns {(Promise <object>|Promise <null>)} validationErrors
     */
    const validateSlug = async (components) => {
        const componentToValidate = findComponentRequiringValidation(components);

        if (!componentToValidate) {
          return null;
        }

        // eslint-disable-next-line one-var
        const [uri, data] = componentToValidate,
          componentName = getComponentName(uri);

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
        state.components
      );

    return validationError ? [validationError] : [];
  }
};
