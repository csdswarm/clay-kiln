'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe(dirname, function () {
  describe(filename, function () {

    describe('render', function () {
      const method = lib[this.title],
        mockLocals = { site: { slug: 'www.radio.com' } };

      it('should set data.host to the first item in the hosts array', function () {
        const hosts = [{ text: 'some_host' }],
          data = method('some_ref', { hosts }, mockLocals);

        expect(data.host).that.equal('some_host');
        expect(data.host).to.be.a('string');
      });
    });

  });
});
