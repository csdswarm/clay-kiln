/* eslint-disable max-nested-callbacks */
'use strict';

const chai = require('chai'),
  { expect } = chai,
  sinon = require('sinon'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  _find = require('lodash/find');

process.env.ARTICLE_AD_INSERT_EVERY = 3;

describe(dirname, () => {
  describe(filename, () => {
    const { _internals: { injectAdsToArticleContent, removeAdsFromArticleContent } } = require('./model');

    describe('render', () => {
      let sandbox;
      const data = {
        content: Array(3).fill({ _ref: '' })
      };

      beforeEach(function () {
        data.content = Array(3).fill({ _ref: '' });
        sandbox = sinon.sandbox.create();
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('should not have and ad instance at all.', () => {
        injectAdsToArticleContent(data);

        expect(data.content).to.have.lengthOf(3);
        expect(_find(data.content, { _ref: '/_components/google-ad-manager/instances/mediumRectangleContentBody' })).to.not.exist;
      });

      it('should have and ad instance after the 4th component.', () => {
        data.content = [
          ...data.content,
          ...Array(2).fill({ _ref: '' })
        ];

        injectAdsToArticleContent(data);

        expect(data.content).to.have.lengthOf(6);
        expect(data.content[3]._ref).to.include('/_components/google-ad-manager/instances/mediumRectangleContentBody');
      });

      it('should only have and ad instance after the 4th component.', () => {
        data.content = [
          ...data.content,
          ...Array(4).fill({ _ref: '' })
        ];

        injectAdsToArticleContent(data);

        expect(data.content).to.have.lengthOf(8);
        expect(data.content[3]._ref).to.include('/_components/google-ad-manager/instances/mediumRectangleContentBody');
        expect(data.content.filter(({ _ref }) => _ref.includes('/_components/google-ad-manager/instances/mediumRectangleContentBody')).length).to.equal(1);
      });

      it('should have two ad instances, one after the 3rd component and one after the 6th component.', () => {
        data.content = [
          ...data.content,
          ...Array(5).fill({ _ref: '' })
        ];

        injectAdsToArticleContent(data);

        expect(data.content).to.have.lengthOf(10);
        expect(data.content[3]._ref).to.include('/_components/google-ad-manager/instances/mediumRectangleContentBody');
        expect(data.content[7]._ref).to.include('/_components/google-ad-manager/instances/mediumRectangleContentBody');
        expect(data.content.filter(({ _ref }) => _ref.includes('/_components/google-ad-manager/instances/mediumRectangleContentBody')).length).to.equal(2);
      });

      it('should remove all google ad instances from content.', () => {
        data.content = [
          ...data.content,
          ...Array(5).fill({ _ref: '' })
        ];

        injectAdsToArticleContent(data);
        removeAdsFromArticleContent(data);

        expect(data.content).to.have.lengthOf(8);
        expect(data.content.filter(({ _ref }) => _ref.includes('/_components/google-ad-manager')).length).to.equal(0);
      });

    });
  });
});
