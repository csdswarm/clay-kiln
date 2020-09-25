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
    const { save } = adTags,
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

    return { mockLocals, mockData, expectedTags, save };
  };

  describe('save', () => {
    function setup_render() {
      const { mockLocals, mockData, expectedTags, save } = setup_model();

      return { mockLocals, mockData, expectedTags, save };
    };

    it('Should include a tagString with all items separated by comma', async () => {
      const { mockLocals, mockData, save } = setup_render(),
        data = await save('some_ref', mockData, mockLocals);

      expect(data).to.have.own.property('tagString');
      expect(data.tagString).to.eq('One,Two Strings,Also multiple Strings');
    });

    it('Should include the slug text for all tags', async () => {
      const { mockLocals, mockData, expectedTags, save } = setup_render(),
        data = await save('some_ref', mockData, mockLocals);

      expect(data).to.have.own.property('tagString');
      expect(data.items).to.deep.eq(expectedTags);
    });
  });
});
