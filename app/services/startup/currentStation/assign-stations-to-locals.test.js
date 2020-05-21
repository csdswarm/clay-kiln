'use strict';
const
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  assignStationsToLocals = require('./assign-stations-to-locals'),

  { expect } = chai;

chai.use(sinonChai);

describe('startup', () => {
  afterEach(sinon.restore);

  describe('currentStation', () => {

    describe('assign-stations-to-locals', () => {
      function setup_assignStationsToLocals(path) {
        const locals = sinon.spy({}),
          options = {
            req: {
              path,
              query: {},
              host: 'site.demo.com',
              originalUrl: 'site.demo.com/',
              get: sinon.fake()

            },
            allStations: sinon.spy({
              bySlug: {
                'abc-123': { id: 123, name: 'ABC 12.3 FM', slug: 'abc-123', callsign: 'WABC' },
                'xyz-the-z': { id: 100, name: 'The Z - Country', slug: 'xyz-the-z', callsign: 'KXYZ' }
              },
              byId: 100
            })
          };

        return { assignStationsToLocals, locals, options };
      }

      it('assign stations to locals located in the homepage', async () => {
        const { assignStationsToLocals, locals, options } = setup_assignStationsToLocals('/_components/more-content-feed/instances/home@published');

        await assignStationsToLocals(locals, options.req, {}, options.allStations);
        expect(locals.station.site_slug).to.equal('');
      });

      it('assign stations to locals located outside homepage', async () => {
        const { assignStationsToLocals, locals, options } = setup_assignStationsToLocals('/_components/more-content-feed/instances/article@published');

        await assignStationsToLocals(locals, options.req, {}, options.allStations);
        expect(locals.station).to.eql({});
      });
    });
  });
});
