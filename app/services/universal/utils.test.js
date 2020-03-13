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

    describe('asInjectable', () => {
      function setup_asInjectable() {
        const { asInjectable } = setup_utils();

        return { asInjectable };
      }

      it('returns the value of a callback along with an injectable method', () => {
        const { asInjectable } = setup_asInjectable(),
          exports = asInjectable(() => '', () => {
            return { message: 'hi' };
          });

        expect(exports).to.have.property('message').that.equals('hi');
        expect(exports).to.respondTo('injectable');
      });

      it('injects internals into the callback but not expose them', () => {
        const { asInjectable } = setup_asInjectable(),
          internals = () => ({ stuff: 'Things' }),
          exports = asInjectable(internals, _ => {
            return { myStuff: `My ${_.stuff}` };
          });

        expect(exports).to.have.property('myStuff').that.equals('My Things');
        expect(exports).not.to.have.property('internals');
      });

      describe('injectable', () => {
        function setup_injectable() {
          const { asInjectable } = setup_asInjectable(),
            internals = () => {
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

          return { asInjectable, exports, testableExports };
        }

        it('provides access to internals', () => {
          const { testableExports } = setup_injectable();

          expect(testableExports).to.have.property('internals');
          expect(testableExports.internals).to.respondTo('someFn');
          expect(testableExports.internals).to.have.property('SOME_VAL').that.eqls(100);
        });

        it('allows internals to be overriden', ()=> {
          const { testableExports } = setup_injectable();

          testableExports.internals.SOME_VAL = 10;
          expect(testableExports.times5k(1)).to.equal(500);
          testableExports.internals.SOME_VAL = 100;
        });
      
        it('allows internals to be spied on', () => {
          const { testableExports } = setup_injectable(),
            spy = sinon.spy(testableExports.internals, 'someFn'),
            result = testableExports.times5k(10);
        
          expect(result).to.equal(50000);
          expect(spy).to.have.been.called;
        });

        it('allows internals to be stubbed, too', () => {
          const { exports, testableExports } = setup_injectable();

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
          const { exports, testableExports } = setup_injectable();

          sinon.stub(testableExports.internals, 'someFn').returns(1);

          expect(testableExports.times5k(1234)).to.equal(50);
          expect(exports.times5k(1234)).to.equal(5000 * 1234);
          sinon.restore();
        });
      
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
  });
});
