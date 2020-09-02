'use strict';

const chai = require('chai'),
  proxyquire = require('proxyquire').noCallThru(),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai');

chai.use(sinonChai);

const getUpdatePageMetadata = ({ put }) => {
    return proxyquire('./update-page-metadata', { axios: { put } });
  },
  accessKey = 'some access key',
  protocol = 'https',
  { expect } = chai,
  headers = { headers: { Authorization: `token ${accessKey}` } };

let oldAccessKey,
  oldProtocol;

describe('update-page-metadata', () => {
  before(() => {
    oldAccessKey = process.env.CLAY_ACCESS_KEY;
    oldProtocol = process.env.CLAY_SITE_PROTOCOL;

    process.env.CLAY_ACCESS_KEY = accessKey;
    process.env.CLAY_SITE_PROTOCOL = protocol;
  });

  after(() => {
    process.env.CLAY_ACCESS_KEY = oldAccessKey;
    process.env.CLAY_SITE_PROTOCOL = oldProtocol;
  });

  it('should PUT to the meta components', () => {
    const put = sinon.spy(),
      mockArticleData = getMockArticleData(),
      fn = getUpdatePageMetadata({ put });

    fn(mockArticleData);

    expect(put).to.have.callCount(4);

    expect(put.getCall(0).args).to.deep.equal([
      `${protocol}://description-ref`,
      { description: 'some description' },
      headers
    ]);

    expect(put.getCall(1).args).to.deep.equal([
      `${protocol}://image-ref`,
      { imageUrl: 'some image' },
      headers
    ]);

    expect(put.getCall(2).args).to.deep.equal([
      `${protocol}://tags-ref`,
      {
        authors: [{
          slug: 'the-associated-press',
          text: 'The Associated Press'
        }],
        contentTagItems: 'some items',
        contentType: 'article',
        noIndexNoFollow: true,
        publishDate: 'some date',
        secondarySectionFront: 'a secondary section front',
        sectionFront: 'a section front'
      },
      headers
    ]);

    expect(put.getCall(3).args).to.deep.equal([
      `${protocol}://title-ref`,
      {
        kilnTitle: 'some headline',
        ogTitle: 'some headline',
        title: 'some headline',
        twitterTitle: 'some headline'
      },
      headers
    ]);
  });
});

function getMockArticleData() {
  return {
    article: {
      contentType: 'article',
      date: 'some date',
      feedImgUrl: 'some image',
      headline: 'some headline',
      pageDescription: 'some description',
      secondarySectionFront: 'a secondary section front',
      sectionFront: 'a section front',
      tags: { items: 'some items' }
    },

    metaDescription: { _ref: 'description-ref' },
    metaImage: { _ref: 'image-ref' },
    metaTags: { _ref: 'tags-ref' },
    metaTitle: { _ref: 'title-ref' }
  };
}
