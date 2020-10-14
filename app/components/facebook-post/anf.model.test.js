'use strict';

/* eslint-disable one-var */

const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const noop = require('lodash/noop');
const dirname = __dirname.split('/').pop();
const filename = __filename.split('/').pop().split('.').shift();
const sinon = require('sinon');
const { isEmptyComponent } = require('../../services/universal/contentAppleNews/utils');
const facebookPostAnfModel = proxyquire('./anf.model', {
  '../../services/universal/log': {
    setup: () => noop
  }
});
const anfFacebookPost = (URL) => ({
  role: 'facebook_post',
  URL,
  layout: 'bodyItemLayout'
});

describe(`${dirname}/${filename}`, () => {
  const mockRef = '_ref';
  const mockLocals = {};

  it('camel-cased page name pattern', () => {
    const url = 'https://www.facebook.com/pageName/posts/1234';

    expect(
      facebookPostAnfModel(mockRef, { url })
    ).to.deep.equal(
      anfFacebookPost(url)
    );
  });

  it('number-based page name pattern', () => {
    const url = 'https://www.facebook.com/1234/posts/1234';

    expect(
      facebookPostAnfModel(mockRef, { url })
    ).to.deep.equal(
      anfFacebookPost(url)
    );
  });

  it('kebab-cased page name pattern', () => {
    const url = 'https://www.facebook.com/page-name/posts/1234';

    expect(
      facebookPostAnfModel(mockRef, { url })
    ).to.deep.equal(
      anfFacebookPost(url)
    );
  });

  it('snake-cased page name pattern', () => {
    const url = 'https://www.facebook.com/page_name/posts/1234';

    expect(
      facebookPostAnfModel(mockRef, { url })
    ).to.deep.equal(
      anfFacebookPost(url)
    );
  });

  it('snake-cased page name activity pattern', () => {
    const url = 'https://www.facebook.com/userName/activity/1234';

    expect(
      facebookPostAnfModel(mockRef, { url })
    ).to.deep.equal(
      anfFacebookPost(url)
    );
  });

  it('photo.php pattern', () => {
    const url = 'https://www.facebook.com/photo.php?fbid=1234';

    expect(
      facebookPostAnfModel(mockRef, { url })
    ).to.deep.equal(
      anfFacebookPost(url)
    );
  });

  it('photos pattern', () => {
    const url = 'https://www.facebook.com/photos/1234';

    expect(
      facebookPostAnfModel(mockRef, { url })
    ).to.deep.equal(
      anfFacebookPost(url)
    );
  });

  it('permalink pattern', () => {
    const url = 'https://www.facebook.com/permalink.php?story_fbid=1234&set=a.1234';

    expect(
      facebookPostAnfModel(mockRef, { url })
    ).to.deep.equal(
      anfFacebookPost(url)
    );
  });

  it('translates cms photo url', () => {
    const photoId = 1023;
    const translationResult = facebookPostAnfModel(
      mockRef,
      { url: `https://www.facebook.com/pageName/photos/a.1023/${photoId}` }
    );

    expect(
      translationResult
    ).to.deep.equal(
      anfFacebookPost(`https://www.facebook.com/pageName/posts/${photoId}`)
    );
  });

  it('translates cms facebook photo url with query params', () => {
    const photoId = 1023;
    const url = `https://www.facebook.com/pageName/photos/a.10150413121115078/${photoId}/?type=3&theater`;
    const translationResult = facebookPostAnfModel(mockRef, { url });

    expect(
      translationResult
    ).to.deep.equal(
      anfFacebookPost(`https://www.facebook.com/pageName/posts/${photoId}`)
    );
  });

  it('handles and logs fb video as unsupported', () => {
    const videoId = 416467559119860;
    const url = `https://www.facebook.com/pageName/videos/${videoId}/`;

    expect(
      isEmptyComponent(
        facebookPostAnfModel(mockRef, { url })
      )
    ).to.be.true;
  });

  it('handles and logs unsupported urls', () => {
    const logSpy = sinon.spy();
    const url = 'https://www.facebook.com/pageName/posts-abc/1234/';

    expect(
      isEmptyComponent(
        facebookPostAnfModel(mockRef, { url }, mockLocals, logSpy)
      )
    ).to.be.true;
    sinon.assert.calledOnce(logSpy);

    const {
      args
    } = logSpy.getCall(0);
    const [arg0, arg1, arg2] = args;

    expect(args.length).to.equal(3);
    expect(arg0).to.equal('warn');
    expect(typeof arg1).to.equal('string');
    expect(typeof arg2).to.equal('object');
  });

  it('handles empty urls', () => {
    const logSpy = sinon.spy();

    expect(
      isEmptyComponent(
        facebookPostAnfModel(mockRef, { url: '' }, mockLocals, logSpy)
      )
    ).to.be.true;
    sinon.assert.calledOnce(logSpy);
  });
});
