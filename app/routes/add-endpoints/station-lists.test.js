'use strict';

const
  stationLists = require('./station-lists'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  { expect } = chai;

chai.use(sinonChai);

describe('routes', () => {

  afterEach(sinon.restore);

  describe('add-endpoints', () => {
    describe('station-lists', () => {

      function setup_stationLists(lists = { 'test-list': true }) {
        const { _internals: __ } = stationLists,
          next = sinon.stub(),
          routes = {},
          router = sinon.spy({
            get(route, fn) {
              routes[route] = res => fn({}, res, next);
            }
          });

        sinon.stub(__, 'STATION_LISTS').value(lists);
        sinon.stub(__, 'retrieveList').resolves([]);

        stationLists(router);

        return { next, routes, router, __ };
      }

      it('creates routes for each station list', () => {
        const { router } = setup_stationLists({ 'station-list': true, 'secondary-section-front': true });

        expect(router.get).to.have.been.calledWith('/_lists/station-list');
        expect(router.get).to.have.been.calledWith('/_lists/secondary-section-front');
        expect(router.get).to.have.been.calledTwice;
      });

      it('does not reroute if station slug for permissions is empty', async () => {
        const { next, routes } = setup_stationLists(),
          route = Object.values(routes)[0],
          res = { locals: { stationForPermissions: { site_slug: '' } } };

        await route(res);

        expect(next).to.have.been.called;
      });

      it('does not send a station list if station slug permissions does not exist', async () => {
        const { next, routes, __ } = setup_stationLists(),
          route = Object.values(routes)[0],
          res = { locals: {} };

        await route(res);

        expect(next).to.have.been.called;
        expect(__.retrieveList).not.to.have.been.called;
      });

      it('requests json data from the specified list when a station slug exists', async () => {
        const { next, routes, __ } = setup_stationLists(),
          route = Object.values(routes)[0],
          locals = { stationForPermissions: { site_slug: 'kxyz' } },
          res = { locals,json: JSON.stringify };

        sinon.spy(res, 'json');

        await route(res);

        expect(next).not.to.have.been.called;
        expect(__.retrieveList).to.have.been.calledWith('test-list', { locals });
      });

      it('sends an error to next if route throws', async () => {
        const { next, routes } = setup_stationLists(),
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
