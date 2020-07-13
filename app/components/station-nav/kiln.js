'use strict';
const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const { site_slug } = window.kiln.locals.station;

  if (site_slug) {
    schema.primaryLinks = new KilnInput(schema, 'primaryLinks');
    const secondaryLink = schema.primaryLinks._has.props
      .find(item => item.prop === 'secondaryLinks')._has.validate = {
        required: {
          field: 'drawer',
          operator: 'truthy'
        }
      };

    schema.secondaryLinks = new KilnInput(secondaryLink, 'secondaryLinks');
  }
  return schema;
};
