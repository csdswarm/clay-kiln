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

    describe('addHiddenProperty', () => {
      function setup_addHiddenProperty() {
        const { addHiddenProperty } = setup_utils();

        return { addHiddenProperty };
      }

      it('adds a property that is not visible to Object.keys/entries, for..in, stringify or hasOwnProperty', () => {
        const { addHiddenProperty } = setup_addHiddenProperty(),
          obj = { prop1: 'Present', prop2: 'Here' };
        let keys = Object.keys(obj);

        expect(keys.length).to.equal(2);

        obj.prop3 = 'Also here';
        keys = Object.keys(obj);

        expect(keys.length).to.equal(3);
        expect(keys).to.include('prop3');

        addHiddenProperty(obj, 'prop4', 'Here, but not obvious');

        keys = Object.keys(obj);
        expect(keys.length).to.equal(3);
        expect(keys).not.to.include('prop4');

        expect(Object.entries(obj)).to.deep.include(['prop3', 'Also here']);
        expect(Object.entries(obj)).not.to.deep.include(['prop4', 'Here, but not obvious']);

        // eslint-disable-next-line guard-for-in
        for (const key in obj) {
          expect(key).not.to.equal('prop4');
        }

        expect(JSON.stringify(obj)).to.equal('{"prop1":"Present","prop2":"Here","prop3":"Also here"}');
        // hasOwnProperty won't get it
        expect(Object.hasOwnProperty(obj, 'prop4')).to.be.false;

        expect(obj.prop4).to.equal('Here, but not obvious');
        // but getOwnPropertyNames should
        expect(Object.getOwnPropertyNames(obj)).to.include('prop4');
      });
    });

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
