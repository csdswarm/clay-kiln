'use strict';

const chai = require('chai'),
  { expect } = chai,
  metaTags = require('./model'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('meta-tags', function () {
  afterEach(sinon.restore);

  function setup_model() {
    const { render } = metaTags,
      mockLocals = { },
      mockData = {
        contentTagItems: [
          { slug: 'one', text: 'One' },
          { slug: 'two-strings', text: 'Two Strings',  count: 1 },
          { slug: 'also-multiple-strings', text: 'Also multiple Strings', count: 1 }
        ]
      };

    return { mockLocals, mockData, render };
  };

  describe('render', () => {
    function setup_render() {
      const { mockLocals, mockData, render } = setup_model();

      return { mockLocals, mockData, render };
    };

    it('Should include "editorial tags" data in the metaTags array', async () => {
      const { mockLocals, mockData, render } = setup_render(),
        data = await render('some_ref', mockData, mockLocals);

      expect(data).to.have.own.property('metaTags');
      expect(data.metaTags).to.deep.include({
        name: 'editorial tags',
        content: 'One ,Two Strings ,Also multiple Strings'
      });
    });

    it('Shouldn\'t include "editorial tags" data in the unusedTags array', async () => {
      const { mockLocals, mockData, render } = setup_render(),
        data = await render('some_ref', mockData, mockLocals);

      expect(data).to.haveOwnProperty('unusedTags');
      expect(data.unusedTags).to.not.deep.include({ type: 'name', name: 'editorial tags' });
    });
  });
});
