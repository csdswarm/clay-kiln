'use strict';

const _every = require('lodash/every'),
  proxyquire = require('proxyquire').noCallThru(),
  sinon = require('sinon'),
  { expect } = require('chai');

describe('clone-content', () => {
  it('should remove stationSlug from the cloned content', async () => {
    const put = sinon.spy(),
      cloneContent = getCloneContent({ db: { put } }),
      mock = {
        req: getMockReq(),
        res: getMockRes()
      };

    await cloneContent(mock.req, mock.res);

    const resultContentKeys = Object.keys(put.args[0][1]),
      hasNoStationProps = _every(resultContentKeys, key => {
        // stationSyndication isn't a 'station prop'
        return key === 'stationSyndication'
          || !key.startsWith('station');
      }),
      hasNoAdManagerInstance = !put.args[0][1].content.includes('_component/google-ad-manager/instances');

    expect(put.calledOnce).to.be.true;
    expect(hasNoStationProps).to.be.true;
    expect(hasNoAdManagerInstance).to.be.true;
  });
});

function getMockReq() {
  return {
    body: {
      canonicalUrl: 'https://clay.radio.com/wwjnewsradio/news/news-southfield-man-charged-in-180k-unemployment-fraud-scheme',
      stationSlug: ''
    },
    hostname: 'https://clay.radio.com'
  };
}

function getMockRes() {
  const res = {
    locals: {},
    send: () => res,
    status: () => res
  };

  return res;
}

function getMockResultContent() {
  return {
    date: '2020-08-21T11:15:00.000-05:00',
    stationCallsign: 'WWJAM',
    stationLogoUrl: 'https://images.radio.com/logos/WWJAM.jpg',
    stationName: 'WWJ Newsradio 950',
    stationSlug: 'wwjnewsradio',
    stationTimezone: 'some timezone',
    stationURL: 'https://wwjnewsradio.radio.com/',
    content: [
      {
        _ref: 'clay.radio.com/_components/paragraph/instances/1234567890'
      }, {
        _ref: 'clay.radio.com/_components/google-ad-manager/instances/xyzabcdefghijk'
      }
    ]
  };
}

function getCloneContent({ db } = {}) {
  db = Object.assign(
    {
      get: () => Promise.resolve(getMockResultContent()),
      raw: () => Promise.resolve({
        rows: [{ data: { layout: '' } }]
      }),
      put: () => Promise.resolve()
    },
    db
  );
  const { cloneContent } = proxyquire('./clone-content', {
    '../../services/server/db': db,
    '../../services/server/page-utils': {
      createPage: () => Promise.resolve({ main: [''] })
    },
    '../../services/universal/rest': {
      delete: () => Promise.resolve({ data: { status: 200 } })
    }
  });

  return cloneContent;
}
