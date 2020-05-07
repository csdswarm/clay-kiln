'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  { autoLink } = require('.');

const getLocals = () => ({
  site: {
    host: 'somehost.com'
  }
});

describe(dirname, function () {
  describe('autoLink', function () {
    it('creates one or more links based on property names in data', async () => {
      const data = { a: 'ay', b: 'bee' },
        props = ['a'];

      await autoLink(data, props, getLocals());

      expect(data.breadcrumbs)
        .to.eql([
          { text: 'ay', url: '//somehost.com/ay', hidden: false }
        ]);
    });

    it('extends each link with the slug before it', async () => {
      const data = { a: 'ay', b: 'bee', c: 'cee' },
        props = ['a', 'b', 'c'];

      await autoLink(data, props, getLocals());

      expect(data.breadcrumbs)
        .to.eql([
          { text: 'ay', url: '//somehost.com/ay', hidden: false },
          { text: 'bee', url: '//somehost.com/ay/bee', hidden: false },
          { text: 'cee', url: '//somehost.com/ay/bee/cee', hidden: false }
        ]);
    });

    it('ignores properties that are missing', async () => {
      const data = { a: 'ay', b: 'bee', c: 'cee' },
        props = ['a', 'b', 'd'];

      await autoLink(data, props, getLocals());

      expect(data.breadcrumbs)
        .to.eql([
          { text: 'ay', url: '//somehost.com/ay', hidden: false },
          { text: 'bee', url: '//somehost.com/ay/bee', hidden: false }
        ]);
    });

    it('lower cases all letters in slugs', async () => {
      const data = { a: 'Ay', b: 'Bee' },
        props = ['a', 'b'];

      await autoLink(data, props, getLocals());

      expect(data.breadcrumbs)
        .to.eql([
          { text: 'Ay', url: '//somehost.com/ay', hidden: false },
          { text: 'Bee', url: '//somehost.com/ay/bee', hidden: false }
        ]);
    });

    it('hyphenates spaces', async () => {
      const data = { a: 'Ay Thing', b: 'Bee Gone Foul Pirate' },
        props = ['a', 'b'];

      await autoLink(data, props, getLocals());

      expect(data.breadcrumbs)
        .to.eql([
          { text: 'Ay Thing', url: '//somehost.com/ay-thing', hidden: false },
          { text: 'Bee Gone Foul Pirate', url: '//somehost.com/ay-thing/bee-gone-foul-pirate', hidden: false }
        ]);
    });

    it('url escapes special characters / and &', async () => {
      const data = { a: 'Ay Thing/Whosiwatsit', b: 'Bee Gone & Leave Now' },
        props = ['a', 'b'];

      await autoLink(data, props, getLocals());

      expect(data.breadcrumbs)
        .to.eql([
          { text: 'Ay Thing/Whosiwatsit', url: '//somehost.com/ay-thing-whosiwatsit', hidden: false },
          { text: 'Bee Gone & Leave Now', url: '//somehost.com/ay-thing-whosiwatsit/bee-gone-leave-now', hidden: false }
        ]);
    });
  });
});
