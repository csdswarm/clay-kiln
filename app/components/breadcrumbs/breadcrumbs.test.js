'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  { autoLink } = require('.');

describe(dirname, function () {
  describe('autoLink', function () {

    it('creates one or more links based on property names in data', () => {
      const data = { a: 'ay', b: 'bee' },
        props = ['a'];

      autoLink(data, props, 'somehost.com');
      expect(data.breadcrumbs)
        .to.eql([
          { text: 'ay', url: '//somehost.com/ay' }
        ]);
    });

    it('extends each link with the slug before it', () => {
      const data = { a: 'ay', b: 'bee', c: 'cee' },
        props = ['a', 'b', 'c'];

      autoLink(data, props, 'somehost.com');
      expect(data.breadcrumbs)
        .to.eql([
          { text: 'ay', url: '//somehost.com/ay' },
          { text: 'bee', url: '//somehost.com/ay/bee' },
          { text: 'cee', url: '//somehost.com/ay/bee/cee' }
        ]);
    });

    it('ignores properties that are missing', () => {
      const data = { a: 'ay', b: 'bee', c: 'cee' },
        props = ['a', 'b', 'd'];

      autoLink(data, props, 'somehost.com');
      expect(data.breadcrumbs)
        .to.eql([
          { text: 'ay', url: '//somehost.com/ay' },
          { text: 'bee', url: '//somehost.com/ay/bee' }
        ]);
    });

    it('lower cases all letters in slugs', ()=>{
      const data = { a: 'Ay', b: 'Bee' },
        props = ['a', 'b'];

      autoLink(data, props, 'somehost.com');
      expect(data.breadcrumbs)
        .to.eql([
          { text: 'Ay', url: '//somehost.com/ay' },
          { text: 'Bee', url: '//somehost.com/ay/bee' }
        ]);
    });

    it('hyphenates spaces', () => {
      const data = { a: 'Ay Thing', b: 'Bee Gone Foul Pirate' },
        props = ['a', 'b'];

      autoLink(data, props, 'somehost.com');
      expect(data.breadcrumbs)
        .to.eql([
          { text: 'Ay Thing', url: '//somehost.com/ay-thing' },
          { text: 'Bee Gone Foul Pirate', url: '//somehost.com/ay-thing/bee-gone-foul-pirate' }
        ]);
    });

    it('url escapes special characters / and &', () => {
      const data = { a: 'Ay Thing/Whosiwatsit', b: 'Bee Gone & Leave Now' },
        props = ['a', 'b'];

      autoLink(data, props, 'somehost.com');
      expect(data.breadcrumbs)
        .to.eql([
          { text: 'Ay Thing/Whosiwatsit', url: '//somehost.com/ay-thing%2Fwhosiwatsit' },
          { text: 'Bee Gone & Leave Now', url: '//somehost.com/ay-thing%2Fwhosiwatsit/bee-gone-%26-leave-now' }
        ]);
    });
  });
});
