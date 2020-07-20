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

    it('should create breadcrumb based on locals station slug', async () => {
      const { autoLink, __ } = setup_autoLink(),
        data = {
          stationSlug: 'stationx',
          stationName: 'Station X',
          sectionFront: 'modern',
          secondarySectionFront: 'fashion'
        },
        props = ['sectionFront', 'secondarySectionFront'];

      __.retrieveList.resolves([
        { name: 'Music', value: 'music' },
        { name: 'News', value: 'news' },
        { name: 'Sports', value: 'sports' },
        { name: '1Thing', value: '1thing' },
        { name: 'Modern', value: 'modern' },
        { name: 'Fashion', value: 'fashion' }
      ]);

      await autoLink(data, props, { ...getLocals(), station: {
        site_slug:'stationx',
        callsign: 'stationx',
        name: 'Station X'
      } });

      expect(data.breadcrumbs).to.eql([
        { text: 'Station X', url: '//somehost.com/stationx', hidden: false },
        { text: 'Modern', url: '//somehost.com/stationx/modern', hidden: false },
        { text: 'Fashion', url: '//somehost.com/stationx/modern/fashion', hidden: false }
      ]);
    });

    it('should create breadcrumb based on locals station slug, removing sectionFront and secondarySectionFront from breadcrumbs when data.stationSlug does not match locals.station.site_slug', async () => {
      const { autoLink, __ } = setup_autoLink(),
        data = {
          stationSlug: 'stationx',
          stationName: 'Station X',
          sectionFront: 'modern',
          secondarySectionFront: 'fashion'
        },
        props = ['sectionFront', 'secondarySectionFront'];

      __.retrieveList.resolves([
        { name: 'Music', value: 'music' },
        { name: 'News', value: 'news' },
        { name: 'Sports', value: 'sports' },
        { name: '1Thing', value: '1thing' },
        { name: 'Modern', value: 'modern' },
        { name: 'Fashion', value: 'fashion' }
      ]);

      await autoLink(data, props, { ...getLocals(), station: {
        site_slug:'localsstationx',
        callsign: 'localsstationx',
        name: 'Locals Station X'
      } });

      expect(data.breadcrumbs).to.eql([
        { text: 'Locals Station X', url: '//somehost.com/localsstationx', hidden: false }
      ]);
    });

    it('should create breadcrumb based on the syndicated station section', async () => {
      const { autoLink, __ } = setup_autoLink(),
        data = {
          stationSlug: 'stationx',
          stationName: 'Station X',
          sectionFront: 'primarysectionx',
          secondarySectionFront: 'secondarysectionx',
          stationSyndication: [{
            callsign: 'STATION-Y',
            stationSlug: 'stationy',
            stationName: 'Station Y',
            sectionFront: 'primary',
            secondarySectionFront: 'secondary'
          }]
        },
        props = ['sectionFront', 'secondarySectionFront'];

      __.retrieveList.resolves([
        { name: 'Music', value: 'music' },
        { name: 'News', value: 'news' },
        { name: 'Sports', value: 'sports' },
        { name: '1Thing', value: '1thing' },
        { name: 'Primary Section X', value: 'primarysectionx' },
        { name: 'Secondary Section X', value: 'secondarysectionx' },
        { name: 'Primary Section Front', value: 'primary' },
        { name: 'Secondary Section Front', value: 'secondary' }
      ]);

      await autoLink(data, props, { ...getLocals(), station: {
        site_slug:'stationy',
        callsign: 'STATION-Y',
        name: 'Station Y'
      } });

      expect(data.breadcrumbs).to.eql([
        { text: 'Station Y', url: '//somehost.com/stationy', hidden: false },
        { text: 'Primary Section Front', url: '//somehost.com/stationy/primary', hidden: false },
        { text: 'Secondary Section Front', url: '//somehost.com/stationy/primary/secondary', hidden: false }
      ]);
    });

    it('should create breadcrumb based on the station section front when the proper syndicated data is not defined', async () => {
      const { autoLink, __ } = setup_autoLink(),
        data = {
          stationSlug: 'stationx',
          stationName: 'Station X',
          sectionFront: 'primarysectionx',
          secondarySectionFront: 'secondarysectionx',
          stationSyndication: [{
            callsign: 'STATION-Y',
            stationSlug: 'stationy',
            stationName: 'Station Y' // Missing sectionFront
          }]
        },
        props = ['sectionFront', 'secondarySectionFront'];

      __.retrieveList.resolves([
        { name: 'Music', value: 'music' },
        { name: 'News', value: 'news' },
        { name: 'Sports', value: 'sports' },
        { name: '1Thing', value: '1thing' },
        { name: 'Primary Section Front', value: 'primary' },
        { name: 'Secondary Section Front', value: 'secondary' },
        { name: 'Primary Section X', value: 'primarysectionx' },
        { name: 'Secondary Section X', value: 'secondarysectionx' }
      ]);

      await autoLink(data, props, { ...getLocals(), station: {
        site_slug:'stationx',
        callsign: 'STATION-X',
        name: 'Station X'
      } });

      expect(data.breadcrumbs).to.eql([
        { text: 'Station X', url: '//somehost.com/stationx', hidden: false },
        { text: 'Primary Section X', url: '//somehost.com/stationx/primarysectionx', hidden: false },
        { text: 'Secondary Section X', url: '//somehost.com/stationx/primarysectionx/secondarysectionx', hidden: false }
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
