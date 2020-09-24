'use strict';
const
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  utils = require('./utils'),

  { expect } = chai;

chai.use(sinonChai);

describe('universal', () => {
  afterEach(sinon.restore);

  describe('utils', () => {
    function setup_utils() {
      return { ...utils };
    }

    describe('addLazyLoadProperty', ()=> {
      function setup_addLazyLoadProperty() {
        const { addLazyLoadProperty } = setup_utils(),
          bar = sinon.stub().returns('Bar'),
          obj = {
            a: 'Foo'
          };

        addLazyLoadProperty(obj, 'b', bar);

        return { obj, bar };
      }

      it('adds a property to an object', () => {
        const { obj } = setup_addLazyLoadProperty();

        expect(obj).to.have.property('a');
      });

      it('does not invoke the callback on the property if it is not requested', () => {
        const { obj, bar } = setup_addLazyLoadProperty();

        expect(obj.a).to.eql('Foo');
        expect(bar).not.to.have.been.called;
      });

      it('invokes the callback only one time when the property is accessed', () => {
        const { obj, bar } = setup_addLazyLoadProperty();

        expect(obj.a).to.eql('Foo');
        expect(bar).not.to.have.been.called;

        expect(obj.b).to.eql('Bar');
        expect(bar).to.have.been.called;

        const b = obj.b;

        expect(b).to.eql('Bar');
        expect(bar).not.to.have.been.calledTwice;
      });

      it('never invokes the callback if the property is manually set', () => {
        const { obj, bar } = setup_addLazyLoadProperty();

        obj.b = 'Bar';

        expect(obj.b).to.eql('Bar');
        expect(bar).not.to.have.been.called;
      });

    });

    describe('coalesce', () => {
      function setup_coalesce() {
        return sinon.spy(setup_utils().coalesce);
      }
      
      it('returns undefined without error if path not found', () => {
        const
          coalesce = setup_coalesce(),
          expected = undefined,
          actual = coalesce({}, 'stuff.n.things');

        expect(actual).to.eql(expected);
        expect(coalesce).not.to.have.thrown;
      });
      
      it('gets paths using lodash `get` style', () => {
        const
          coalesce = setup_coalesce(),
          expected = 'working',
          obj = { stuff: { n: { things: expected } } },
          actual = coalesce(obj, 'stuff.n.things');

        expect(actual).to.eql(expected);
      });

      it('uses lodash `get`, so it can handle arrays, too', () => {
        const
          coalesce = setup_coalesce(),
          expected = 'working',
          obj = { stuff: { n: { things: expected } } },
          actual = coalesce(obj, 'stuff/n/things'.split('/'));

        expect(actual).to.eql(expected);
      });

      it('keeps checking paths until one exists', () => {
        const
          coalesce = setup_coalesce(),
          expected = 'working',
          obj = { stuff: { n: { things: expected } } },
          actual = coalesce(obj, 'not.here', 'nor.here', 'stuff.n.things');

        expect(actual).to.eql(expected);
      });

      it('returns the first matching path', () => {
        const
          coalesce = setup_coalesce(),
          expected = 'working',
          obj = { stuff: { n: { things: expected, other: 'not working' } } },
          actual = coalesce(obj, 'not.here', 'stuff.n.things', 'stuff.n.other');

        expect(actual).to.eql(expected);
      });

      it('does not get hung up on falsey values (except undefined)', () => {
        const
          coalesce = setup_coalesce(),
          expectations = [ 0, '', false, null ];
        
        expectations.forEach(expected => {
          const obj = { expected, other: true },
            actual = coalesce(obj, 'expected', 'other');

          expect(actual).to.eql(expected);
        });

        expect(coalesce({ a: undefined, b: 1 }, 'a', 'b')).to.eql(1);
      });

      it('does not use recursion so it won\'t overflow the stack', () => {
        const
          MIN_AMT_THAT_WOULD_EXCEED_RECURSION_STACK = 475,
          coalesce = setup_coalesce(),
          expected = 'works',
          largeSet = [...Array(MIN_AMT_THAT_WOULD_EXCEED_RECURSION_STACK).keys()].map(n => `not.here.${n}`),
          obj = { it: { is: { here: expected } } },
          actual = coalesce(obj, ...largeSet, 'it.is.here');

        expect(actual).to.eql(expected);
        expect(coalesce).not.to.throw;
      });
    });
    
    describe('postfix', ()=> {
      function setup_postfix() {
        const { postfix } = setup_utils();

        return { postfix };
      }

      it('adds a suffix if the original string is not empty', () => {
        const { postfix } = setup_postfix(),
          result = postfix('test', ' Jr.');

        expect(result).to.eql('test Jr.');
      });

      it('returns an empty string if the value is empty or falsy', () => {
        const { postfix } = setup_postfix(),
          result = postfix('', '-');

        expect(result).to.eql('');

        const result2 = postfix(null, 'suffix');

        expect(result2).to.eql('');
      });
    });

    describe('textToEncodedSlug', () => {
      function setup_textToEncodedSlug() {
        const { textToEncodedSlug } = setup_utils();

        return { textToEncodedSlug };
      }

      it('trims excess whitespace', () => {
        const { textToEncodedSlug } = setup_textToEncodedSlug();

        expect(textToEncodedSlug('  test   ')).to.eql('test');
      });

      it('lower cases normal text', () => {
        const { textToEncodedSlug } = setup_textToEncodedSlug();

        expect(textToEncodedSlug('Something')).to.eql('something');
      });

      it('replaces spaces with hyphens', () => {
        const { textToEncodedSlug } = setup_textToEncodedSlug();

        expect(textToEncodedSlug('some text')).to.eql('some-text');
      });

      it('url encodes the text', () => {
        const { textToEncodedSlug } = setup_textToEncodedSlug();

        expect(textToEncodedSlug('stuff&things|stuff/things'))
          .to.eql('stuff%26things%7Cstuff%2Fthings');
      });

      it('trims, lowercases, hyphenates and encodes', () => {
        const { textToEncodedSlug } = setup_textToEncodedSlug(),
          text = '  Text & Stuff, Things/Whatchamacallits, and résumé builders  ',
          expected = 'text-%26-stuff%2C-things%2Fwhatchamacallits%2C-and-r%C3%A9sum%C3%A9-builders';

        expect(textToEncodedSlug(text)).to.eql(expected);
      });

    });

    // copied from node_modules/amphora/lib/services/references.test.js and modified to match local standards
    describe('listDeepObjects', function () {
      function setup_listDeepObject() {
        const { listDeepObjects } = setup_utils();

        return { listDeepObjects };
      }

      it('listDeepObjects gets all deep objects', function () {
        const { listDeepObjects } = setup_listDeepObject(),
          result = listDeepObjects({ a:{ b:{ c:{ d:'e' } }, f:{ g:{ h:'e' } } } });

        expect(result).to.have.length(5);
      });

      it('listDeepObjects can filter by existence of properties', function () {
        const { listDeepObjects } = setup_listDeepObject(),
          result = listDeepObjects({ a:{ b:{ c:{ d:'e' } }, f:{ d:{ g:'e' } } } }, 'd');

        expect(result).to.have.length(2);
      });

      it('listDeepObjects can filter by component', function () {
        const { listDeepObjects } = setup_listDeepObject(),
          result = listDeepObjects({ a: { type:'yarn' }, b: { c: { type:'sweater' } } }, obj => !!obj.type );

        expect(result).to.deep.equal([
          { type:'yarn' },
          { type:'sweater' }
        ]);
      });
    });

    describe('bindInstanceFunctions', () => {
      it('should bind class functions to the instance', () => {
        const { bindInstanceFunctions } = setup_utils();

        class SomeClass {
          constructor() {
            bindInstanceFunctions(this);
            this.pass = true;
          }

          getPass() {
            return this.pass;
          }
        }

        const { getPass } = new SomeClass();

        expect(getPass()).to.be.true;
      });
    });
  });
});
