'use strict';

const
  stationLists = require('./station-aware-lists').injectable(),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  { expect } = chai;

chai.use(sinonChai);

describe('routes', () => {

  afterEach(sinon.restore);

  describe('add-endpoints', () => {
    describe('station-aware-lists', () => {

      function setup_stationAwareLists(stationAwareLists = { 'test-list': true }) {
        const { internals: _ } = stationLists,
          next = sinon.stub(),
          routes = {},
          router = sinon.spy({
            get(route, fn) {
              routes[route] = res => fn({}, res, next);
            }
          });

        sinon.stub(_, 'STATION_AWARE_LISTS').value(stationAwareLists);
        sinon.stub(_, 'retrieveList').resolves([]);

        stationLists(router);

        return { next, routes, router, stationAwareLists };
      }

      it('creates routes for each station aware list', () => {
        const { router } = setup_stationAwareLists({ 'station-aware-list': true, 'another-station-aware-list': true });

        expect(router.get).to.have.been.calledWith('/_lists/station-aware-list');
        expect(router.get).to.have.been.calledWith('/_lists/another-station-aware-list');
        expect(router.get).to.have.been.calledTwice;
      });

      it('does not reroute if station slug for permissions is empty', async () => {
        const { next, routes } = setup_stationAwareLists(),
          route = Object.values(routes)[0],
          res = { locals: { stationForPermissions: { site_slug: '' } } };

        await route(res);

        expect(next).to.have.been.called;
      });

      it('does not send a station list if station slug permissions does not exist', async () => {
        const { next, routes } = setup_stationAwareLists(),
          route = Object.values(routes)[0],
          res = { locals: {} };

        await route(res);

        expect(next).to.have.been.called;
        expect(stationLists.internals.retrieveList).not.to.have.been.called;
      });

      it('requests json data from the specified list when a station slug exists', async () => {
        const { next, routes } = setup_stationAwareLists(),
          route = Object.values(routes)[0],
          locals = { stationForPermissions: { site_slug: 'kxyz' } },
          res = { locals,json: JSON.stringify };

        sinon.spy(res, 'json');

        await route(res);

        expect(next).not.to.have.been.called;
        expect(stationLists.internals.retrieveList).to.have.been.calledWith('test-list', locals);
      });

      it('sends an error to next if route throws', async () => {
        const { next, routes } = setup_stationAwareLists(),
          route = Object.values(routes)[0],
          locals = { stationForPermissions: { site_slug: 'kxyz' } },
          res = { locals, json: JSON.stringify };

        sinon.stub(res, 'json').throws('Some Error', 'There was a problem');

        await route(res);

        expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
        expect(next).to.be.calledWith(sinon.match.has('name', 'Some Error'));
        expect(next).to.be.calledWith(sinon.match.has('message', 'There was a problem'));

      });
    });
  });
});
