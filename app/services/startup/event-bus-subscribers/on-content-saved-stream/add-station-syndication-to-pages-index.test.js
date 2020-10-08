'use strict';

const _noop = require('lodash/noop'),
  proxyquire = require('proxyquire'),
  sinon = require('sinon'),
  { expect } = require('chai');

const axiosPost = sinon.spy(_noop),
  esHost = process.env.ELASTIC_HOST,
  fn = proxyquire('./add-station-syndication-to-pages-index', {
    axios: { post: axiosPost }
  }),
  testPageId = 'clay.radio.com/_pages/test-id',
  ops = getOps();

describe('add-station-syndication-to-pages-index', () => {
  beforeEach(() => {
    axiosPost.resetHistory();
  });

  // success cases
  it('should update elasticsearch with the new stationSyndication property', async () => {
    const expected = {
      url: `${esHost}/pages/_doc/${encodeURIComponent(testPageId)}/_update`,
      body: {
        doc: { stationSyndication: [{ test: true }] },
        doc_as_upsert: true
      }
    };

    await fn(ops.good);

    expect(axiosPost.firstCall.args).to.deep.equal([
      expected.url,
      expected.body
    ]);
  });

  it("should short circuit if page isn't published", async () => {
    await fn(ops.notPublished);

    expect(axiosPost.notCalled);
  });

  it('should short circuit if content component not included', async () => {
    await fn(ops.noContent);

    expect(axiosPost.notCalled);
  });
});

function getOps() {
  const good = [
    {
      key: 'clay.radio.com/_components/article/instances/test-id@published',
      value: '{"stationSyndication":[{"test":true}]}'
    },
    {
      key: `${testPageId}@published`
    }
  ];

  return {
    good,
    noContent: [
      good[1]
    ],
    notPublished: [
      good[0],
      {
        key: testPageId
      }
    ]
  };
}
