'use strict';

const sinon = require('sinon'),
  { expect } = require('chai'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe(dirname, function () {
  describe(filename, function () {
    let sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('wrapAuthorProp', function () {
      const fn = lib[this.title];

      it('should return an array of authors wrapped in a `name` property', () => {
        const rawAuthors = ['John Doe', 'Jane Doe'],
          authors = fn(rawAuthors),
          expected = [{ author: [{ name: 'John Doe' }] }, { author: [{ name: 'Jane Doe' }] }];

        expect(Array.isArray(authors)).to.be.true;
        sinon.assert.match(authors, expected);
      });

      it('should return an empty array if there are no authors', () => {
        const authors = fn([]);

        return expect(authors).to.be.empty;
      });
    });

    describe('wrapCategoryProp', function () {
      const fn = lib[this.title];

      it('should return an array of categories wrapped as an attribute', () => {
        const rawCategories = ['tech', 'nymag'],
          categories = fn(rawCategories),
          expected = [
            { category: { _attr: { term: 'tech' } } },
            { category: { _attr: { term: 'nymag' } } }
          ];

        expect(Array.isArray(categories)).to.be.true;
        sinon.assert.match(categories, expected);
      });

      it('should return an empty array if there are no categories', () => {
        const categories = fn([]);

        return expect(categories).to.be.empty;
      });
    });

    describe('mergeContent', function () {
      const fn = lib[this.title];

      it('should return a `p` element as a string of content', () => {
        const data = { data: { text: 'Pizza' }, ref: '/_components/clay-paragraph' },
          result = fn('', data),
          expected = '<p>Pizza</p>';

        expect(result).to.be.a('string');
        sinon.assert.match(result, expected);
      });

      it('should return a `img` element as a string with attributes', () => {
        const imageUrl = 'https://via.placeholder.com/350x150',
          imageCaption = 'Freshly Baked',
          imageCredit = 'logo',
          imageData = { data: { imageUrl, imageCaption, imageCredit }, ref: '/_components/image' },
          result = fn('', imageData),
          expected = `<figure><img src="${imageUrl}" /><figcaption>${imageCaption}<span class="copyright">${imageCredit}</span></figcaption></figure>`;

        expect(result).to.be.a('string');
        sinon.assert.match(result, expected);
      });
    });
  });
});
