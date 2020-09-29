'use strict';

const chai = require('chai'),
  { expect } = chai,
  proxyquire = require('proxyquire').noCallThru(),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('meta-tags', function () {
  afterEach(sinon.restore);

  function setup_model() {
    const metaTags = proxyquire('./model', {
        '../../services/server/branch-io': { getBranchMetaTags : () => [] }
      }),
      { render, getNmcData } = metaTags,
      mockLocals = {
        station: {
          site_slug: 'kroqfm'
        },
        url: 'https://www.radio.com/music/alternative/billie-eilish-on-why-its-a-great-time-to-be-vegan/'
      },
      mockData = {
        contentTagItems: [
          { slug: 'one', text: 'One' },
          { slug: 'two-strings', text: 'Two Strings',  count: 1 },
          { slug: 'also-multiple-strings', text: 'Also multiple Strings', count: 1 }
        ],
        sectionFront: 'primary',
        secondarySectionFront: 'secondary',
        contentType: 'article',
        importedNmcData: {
          cat: 'music',
          pid: 'article_33740@published',
          tag: 'music,pop,alternative,Billie Eilish',
          genre: 'alternative',
          market: 'los angeles',
          station: 'kroqfm'
        }
      };

    return { mockLocals, mockData, render, getNmcData };
  };

  describe('render', () => {
    function setup_render() {
      const { mockLocals, mockData, render } = setup_model();

      return { mockLocals, mockData, render };
    };

    it('includes "editorial tags" data in the metaTags array', async () => {
      const { mockLocals, mockData, render } = setup_render(),
        data = await render('some_ref', mockData, mockLocals);

      expect(data).to.have.own.property('metaTags');
      expect(data.metaTags).to.deep.include({
        name: 'editorial tags',
        content: 'One ,Two Strings ,Also multiple Strings'
      });
    });

    it('don\'t includes "editorial tags" data in the unusedTags array', async () => {
      const { mockLocals, mockData, render } = setup_render(),
        data = await render('some_ref', mockData, mockLocals);

      expect(data).to.haveOwnProperty('unusedTags');
      expect(data.unusedTags).to.not.deep.include({ type: 'name', name: 'editorial tags' });
    });
  });

  describe('getNmcData', () => {
    function setup_data() {
      const { mockLocals, mockData, getNmcData } = setup_model();

      return { mockLocals, mockData, getNmcData };
    };

    it('returns tags generated using the pageData and contentTagItems', async () => {
      const { mockLocals, mockData, getNmcData } = setup_data(),
        nmcData =  getNmcData(false, mockData, mockLocals);

      expect(nmcData).to.have.property('tag');
      expect(nmcData.tag).to.eql('article,primary,secondary,One,Two Strings,Also multiple Strings');
    });

    it('returns tags using the imported information and contentTagItems', async () => {
      const { mockLocals, mockData, getNmcData } = setup_data(),
        nmcData =  getNmcData(true, mockData, mockLocals);

      expect(nmcData.tag).to.eql('article,primary,secondary,One,Two Strings,Also multiple Strings,music,pop,alternative,Billie Eilish');
    });
  });
});
