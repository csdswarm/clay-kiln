'use strict';

const chai = require('chai'),
  { expect } = chai,
  adTags = require('./model'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('ad-tags', function () {
  afterEach(sinon.restore);

  function setup_model() {
    const { render, save } = adTags,
      mockLocals = {
        station: {
          site_slug: 'siteslug'
        }
      },
      mockData = {
        items: [
          { text: 'One' },
          { text: 'Two Strings',  count: 1 },
          { text: 'Also multiple Strings', count: 1 }
        ]
      },
      expectedTags =  [
        { text: 'One', slug: 'one' },
        { text: 'Two Strings',  slug: 'two-strings', count: 1 },
        { text: 'Also multiple Strings', slug: 'also-multiple-strings', count: 1 }
      ];

    return { mockLocals, mockData, expectedTags, render, save };
  };

  describe('render', () => {
    function setup_render() {
      const { mockLocals, mockData, expectedTags, render } = setup_model();

      return { mockLocals, mockData, expectedTags, render };
    };

    it('includes a adTags property with all tags items separated by comma', async () => {
      const { mockLocals, mockData, render } = setup_render(),
        data = await render('some_ref', mockData, mockLocals);

      expect(data._computed).to.have.property('adTags');
      expect(data._computed.adTags).to.eq('One,Two Strings,Also multiple Strings');
    });
  });

  describe('save', () => {
    function setup_save() {
      const { mockLocals, mockData, expectedTags, save } = setup_model();

      return { mockLocals, mockData, expectedTags, save };
    };

    it('includes the slug property for all tags elements', async () => {
      const { mockLocals, mockData, expectedTags, save } = setup_save(),
        data = await save('some_ref', mockData, mockLocals);

      expect(data.items).to.deep.eq(expectedTags);
    });
  });
});
