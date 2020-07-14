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
    const { render } = require('./model');

    describe('render', () => {
      let sandbox;
      const ref = '_components/article/instances/1',
        data = {
          content: Array(3).fill({ _ref: '' })
        },
        locals = {
          loadedIds: [],
          station: {},
          edit: false
        };

      beforeEach(function () {
        data.content = Array(3).fill({ _ref: '' });
        sandbox = sinon.sandbox.create();
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('should not have and ad instance at all.', () => {
        return render(ref, data, locals).then(result => {
          expect(result.content).to.have.lengthOf(3);
          expect(_find(result.content, { _ref: '/_components/google-ad-manager/instances/mediumRectangleBottom' })).to.not.exist;
        });
      });

      it('should have and ad instance after the 4th component.', () => {
        data.content = [
          ...data.content,
          ...Array(2).fill({ _ref: '' })
        ];
        return render(ref, data, locals).then(result => {
          expect(result.content).to.have.lengthOf(6);
          expect(result.content[3]._ref).to.include('/_components/google-ad-manager/instances/mediumRectangleBottom');
        });
      });

      it('should only have and ad instance after the 4th component.', () => {
        data.content = [
          ...data.content,
          ...Array(4).fill({ _ref: '' })
        ];
        return render(ref, data, locals).then(result => {
          expect(result.content).to.have.lengthOf(8);
          expect(result.content[3]._ref).to.include('/_components/google-ad-manager/instances/mediumRectangleBottom');
          expect(result.content.filter(({ _ref }) => _ref.includes('/_components/google-ad-manager/instances/mediumRectangleBottom')).length).to.equal(1);
        });
      });

      it('should have two ad instances, one after the 3rd component and one after the 6th component.', () => {
        data.content = [
          ...data.content,
          ...Array(5).fill({ _ref: '' })
        ];

        return render(ref, data, locals).then(result => {
          expect(result.content).to.have.lengthOf(10);
          expect(result.content[3]._ref).to.include('/_components/google-ad-manager/instances/mediumRectangleBottom');
          expect(result.content[7]._ref).to.include('/_components/google-ad-manager/instances/mediumRectangleBottom');
          expect(result.content.filter(({ _ref }) => _ref.includes('/_components/google-ad-manager/instances/mediumRectangleBottom')).length).to.equal(2);
        });
      });

    });
  });
});
