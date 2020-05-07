'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  removeEmptyComponents = require('./exclude-empty-components'),
  { ANF_EMPTY_COMPONENT } = require('./constants'),
  mockComponents = {
    emptyText: {
      text: ''
    },
    nullText: {
      text: null
    },
    placeholderText: {
      text: 'lorem ipsum dolor'
    }
  };

describe(`${dirname}/${filename}`, () => {
  it('filters out empty components', () => {
    const mockData = {
        components: [
          mockComponents.emptyText,
          mockComponents.nullText,
          mockComponents.placeholderText,
          ANF_EMPTY_COMPONENT,
          {
            role: 'section',
            components: [
              mockComponents.emptyText,
              mockComponents.nullText,
              mockComponents.placeholderText
            ]
          }
        ]
      },
      result = removeEmptyComponents(mockData);

    expect(result).to.deep.equal({
      components: [
        mockComponents.placeholderText,
        {
          role: 'section',
          components: [
            mockComponents.placeholderText
          ]
        }
      ]
    });
  });
});
