'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  { jsdom } = require('jsdom'),
  dom = new jsdom(),
  chai = require('chai'),
  sinonChai = require('sinon-chai'),
  sinon = require('sinon');

global.document = dom.defaultView.document;
global.DOMParser = dom.defaultView.DOMParser;
const { duplicateScript } = require('./add-script-embed');

chai.use(sinonChai);


describe(dirname, function () {
  afterEach(sinon.restore);

  describe(filename, function () {
    describe('duplicate script', function () {
      it('should duplicate script without attributes', function () {
        const script = document.createElement('script');
          
        script.innerHTML = '<script>(function(){ console.log(`Im a IIFE function`);})()</script>';

        const duplicatedSCript = duplicateScript(script);

        expect(duplicatedSCript.getAttribute('async')).to.equal('');
        expect(Array.from(duplicatedSCript.attributes).length).to.equal(1);
      });

      it('should duplicate script with attributes', function () {
        const script = document.createElement('script');
          
        script.innerHTML = '<script>/**/</script>';
        script.src = 'http://cdn.radio.com/script';
        script.id = 'script-id';

        const duplicatedSCript = duplicateScript(script);

        expect(duplicatedSCript.getAttribute('async')).to.equal('');
        expect(duplicatedSCript.src).to.equal('http://cdn.radio.com/script');
        expect(duplicatedSCript.id).to.equal('script-id');
        expect(Array.from(duplicatedSCript.attributes).length).to.equal(3);
      });
    });

  });
});
