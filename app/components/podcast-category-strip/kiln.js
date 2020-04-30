'use strict';

const KilnInput = window.kiln.kilnInput,
  { get } = require('../../services/client/radioApi');

module.exports = (schema) => {
  const kilnInput = new KilnInput(schema);

  schema.category = new KilnInput(schema, 'category');

  kilnInput.subscribe('OPEN_ADD_COMPONENT', async payload => {
    console.log('open add component kilnjs', payload);

    if (payload.path === 'category') {
      let options = [];

      try {
        const { data: categories } = await get(
          'categories',
          {
            sort: 'name',
            page: { size: 100 }
          }
        );

        options = categories.map(category => {
          return {
            name: category.attributes.name,
            value: {
              id: category.id,
              name: category.attributes.name,
              slug: category.attributes.slug
            }
          };
        });
      } catch (e) {
        console.error('Couldn\'t fetch podcast categories. ', e);
      }

      schema.category.setProp('_has',
        { ...schema.category['_has'],
          input: 'select',
          search: true,
          required: true,
          options
        }
      );
    }
  }, true);

  kilnInput.subscribe('OPEN_FORM', payload => {
    console.log('open form kilnjs', payload);
  }, true);

  return schema;
};
