'use strict';

const { _internals: __ } = require('./postup-article'),
  { expect } = require('chai');

describe('feeds', () => {
  describe('transforms', () => {
    describe('postup-article', () => {
      it('removes all script tags', () => {
        const result =  __.removeScripts('<div><script type="text/javascript">blahblah</script><script src="./foo.js"/></div>');

        expect(result).to.equal('<div></div>');
      });
    });
  });
});
