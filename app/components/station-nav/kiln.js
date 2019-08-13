'use strict';

const KilnInput = window.kiln.kilnInput,
  /** 
   * Update type of input for URL when featured link type changes
   * Content type links should use content-search input for URL
   * Other link types should use the regular text (URL) input for URL
   * 
   * @param {Object} input
   * @param {Object} schema
  */
  updateFeaturedLinksUrlInput = (input, schema) => {
    let newURLHasProps;
    
    if (input.data === 'content') {
      newURLHasProps = {
        input: 'content-search'
      };
    } else {
      newURLHasProps = {
        input: 'text',
        type: 'url'
      };
    }

    const featuredLinksHas = schema.featuredLinks['_has'],
      featuredLinksHasProps = featuredLinksHas.props,
      URLPropIndex = featuredLinksHasProps.findIndex(item => item.prop === 'url'),
      updatedURLHasProp = Object.assign(featuredLinksHas, {
        props: [
          ...featuredLinksHasProps.slice(0, URLPropIndex),
          Object.assign(featuredLinksHasProps[URLPropIndex], {
            _has: {
              ...featuredLinksHasProps[URLPropIndex]['_has'],
              ...newURLHasProps
            }
          }),
          ...featuredLinksHasProps.slice(URLPropIndex + 1)
        ]
      });

    schema.featuredLinks.setProp('_has', updatedURLHasProp);
  };

module.exports = schema => {
  const form = new KilnInput(schema);

  schema.featuredLinks = new KilnInput(schema, 'featuredLinks');

  form.subscribe('UPDATE_FORMDATA', input => {
    if (input.path.includes('featuredLinks') && input.path.includes('type')) {
      updateFeaturedLinksUrlInput(input, schema);
    }
  }, true);

  return schema;
};
