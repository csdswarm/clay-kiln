'use strict';

const { autoLink, _internals } = require('.'),
  dirname = __dirname.split('/').pop(),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  { expect } = chai;


chai.use(sinonChai);

const getLocals = () => ({
  site: {
    host: 'somehost.com'
  },
  station: {
    site_slug: ''
  }
});

describe(dirname, function () {
  afterEach(sinon.restore);
  describe('autoLink', function () {

    function setup_autoLink() {
      sinon.stub(_internals, 'retrieveList');
 
      return {
        autoLink,
        __: _internals
      };
    }

    it('creates one or more links based on property names in data', async () => {
      const data = { a: 'ay', b: 'bee' },
        props = ['a'];

      await autoLink(data, props, getLocals());

      expect(data.breadcrumbs)
        .to.eql([
          { text: 'ay', url: '//somehost.com/ay', hidden: false }
        ]);
    });

    it('should create breadcrumb based on the station', async () => {
      const { autoLink, __ } = setup_autoLink(),
        data = {
          stationSyndication: [{
            callsign: 'station-Y',
            stationSlug: 'stationY',
            primarySectionFront: 'primary',
            secondarySectionFront: 'secondary'
          }]
        },
        props = ['primarySectionFront', 'secondarySectionFront'];

      __.retrieveList.resolves([
        { name: 'Music', value: 'music' },
        { name: 'News', value: 'news' },
        { name: 'Sports', value: 'sports' },
        { name: '1Thing', value: '1thing' }
      ]);

      await autoLink(data, props, { ...getLocals(), station: { site_slug:'stationY', callsign: 'station-Y' } });

      expect(data.breadcrumbs).to.eql([
        { text: 'stationY', url: '//somehost.com/stationy', hidden: false },
        { text: 'primary', url: '//somehost.com/stationy/primary', hidden: false },
        { text: 'secondary', url: '//somehost.com/stationy/primary/secondary', hidden: false }
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
