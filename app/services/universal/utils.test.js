'use strict';
const
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  {
    asInjectable,
    listDeepObjects,
    textToEncodedSlug
  } = require('./utils'),
  
  { expect } = chai;

chai.use(sinonChai);

describe('Universal Utils', () => {

  describe('asInjectable', () => {
    it('returns the value of a callback along with an injectable method', () => {
      const exports = asInjectable(() => '', () => {
        return { message: 'hi' };
      });

      expect(exports).to.have.property('message').that.equals('hi');
      expect(exports).to.respondTo('injectable');
    });

    it('injects internals into the callback but not expose them', () => {
      const internals = () => ({ stuff: 'Things' }),
        exports = asInjectable(internals, _ => {
          return { myStuff: `My ${_.stuff}` };
        });

      expect(exports).to.have.property('myStuff').that.equals('My Things');
      expect(exports).not.to.have.property('internals');

    });

    describe('injectable', () => {
      const internals = () => {
          const _ = {
            SOME_VAL: 100,
            someFn: num => num * _.SOME_VAL
          };

          return _;
        },
        exports = asInjectable(internals, _ => {
          return {
            times5k: num => _.someFn(num) * 50
          };
        }),
        testableExports = exports.injectable();

      it('provides access to internals', () => {
        expect(testableExports).to.have.property('internals');
        expect(testableExports.internals).to.respondTo('someFn');
        expect(testableExports.internals).to.have.property('SOME_VAL').that.eqls(100);
      });

      it('allows internals to be overriden', ()=> {
        testableExports.internals.SOME_VAL = 10;
        expect(testableExports.times5k(1)).to.equal(500);
        testableExports.internals.SOME_VAL = 100;
      });
      
      it('allows internals to be spied on', () => {
        const spy = sinon.spy(testableExports.internals, 'someFn'),
          result = testableExports.times5k(10);
        
        expect(result).to.equal(50000);
        expect(spy).to.have.been.called;
      });

      it('allows internals to be stubbed, too', () => {
        let accessed = false;

        sinon.stub(testableExports.internals, 'SOME_VAL').get(() => {
          accessed = true;
          return 1;
        });

        expect(testableExports.times5k(10)).to.equal(500);
        expect(exports.times5k(10)).to.equal(50000);

        expect(accessed).to.be.true;

        sinon.restore();

        const stub = sinon.stub(testableExports.internals, 'someFn').returns(1);

        expect(testableExports.times5k(1234)).to.equal(50);
        expect(stub).to.have.been.called;
        sinon.restore();

        expect(testableExports.times5k(1234)).to.equal(1234 * 5000);
      });


      it('does not interfere with existing exports', ()=>{
        sinon.stub(testableExports.internals, 'someFn').returns(1);

        expect(testableExports.times5k(1234)).to.equal(50);
        expect(exports.times5k(1234)).to.equal(5000 * 1234);
        sinon.restore();
      });
      
    });
  });

  describe('textToEncodedSlug', () => {
    it('trims excess whitespace', () => {
      expect(textToEncodedSlug('  test   ')).to.eql('test');
    });

    it('lower cases normal text', () => {
      expect(textToEncodedSlug('Something')).to.eql('something');
    });

    it('replaces spaces with hyphens', () => {
      expect(textToEncodedSlug('some text')).to.eql('some-text');
    });

    it('url encodes the text', () => {
      expect(textToEncodedSlug('stuff&things|stuff/things'))
        .to.eql('stuff%26things%7Cstuff%2Fthings');
    });

    it('trims, lowercases, hyphenates and encodes', () => {
      const text = '  Text & Stuff, Things/Whatchamacallits, and résumé builders  ',
        expected = 'text-%26-stuff%2C-things%2Fwhatchamacallits%2C-and-r%C3%A9sum%C3%A9-builders';

      expect(textToEncodedSlug(text)).to.eql(expected);
    });

  });

  // The following was copied nearly verbatim from node_modules/amphora/lib/services/references.test.js
  describe('listDeepObjects', function () {
    const fn = listDeepObjects;

    it('listDeepObjects gets all deep objects', function () {
      const result = fn({ a:{ b:{ c:{ d:'e' } }, f:{ g:{ h:'e' } } } });

      expect(result).to.have.length(5);
    });

    it('listDeepObjects can filter by existence of properties', function () {
      const result = fn({ a:{ b:{ c:{ d:'e' } }, f:{ d:{ g:'e' } } } }, 'd');

      expect(result).to.have.length(2);
    });

    it('listDeepObjects can filter by component', function () {
      const result = fn({ a: { type:'yarn' }, b: { c: { type:'sweater' } } }, function (obj) { return !!obj.type; });

      expect(result).to.deep.equal([
        { type:'yarn' },
        { type:'sweater' }
      ]);
    });
  });
});
