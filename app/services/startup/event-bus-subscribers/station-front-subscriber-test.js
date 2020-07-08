'use strict';

const
  subscriber = require('./station-front-subscriber'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  { expect } = chai;

chai.use(sinonChai);

describe('server', () => {
  afterEach(sinon.restore);
  describe('start-up', () => {
    describe('event-bus-subscribers', () => {
      describe('staton-front-subscriber', () => {
        function setup_subscriber({ data = {}, stationSlug = 'radio-abc' } = {}) {
          const { _internals: __ } = subscriber,
            defaultData = [
              {
                uri: 'clay.radio.com/_pages/123456',
                data: {
                  main: [
                    'clay.radio.com/_components/section-front/instances/123456'
                  ]
                } },
              {
                uri: 'clay.radio.com/_pages/abcdef',
                data: {
                  main: [
                    'clay.radio.com/_components/station-front/instances/abcdef'
                  ],
                  ...data
                } }
            ],
            /**
             * turns an array into something that basically looks like a highland stream, for purposes of testing.
             */
            makeMockStream = sinon.spy(data => ({
              filter(cb) {
                const filtered = data.filter(cb);

                filtered.each = filtered.forEach;
                return filtered;
              }
            })),
            throughStub = sinon.spy({
              through: cb => {
                return cb(makeMockStream(defaultData));
              }
            });

          [
            'log',
            'retrieveList',
            'saveList',
            'subscribe'
          ].forEach(method => sinon.stub(__, method));
          
          sinon.stub(__.db, 'get').resolves({ stationSlug });
          
          sinon.stub(__, 'handlePublishStationFront').callsFake(__.handlePublishStationFront.wrappedMethod);
          sinon.spy(__, 'onlyStationFronts');

          __.subscribe.returns(throughStub);

          return { __, defaultData, throughStub, subscriber };
        }

        it('subscribes to station-front components only', () => {
          const { __: { handlePublishStationFront }, defaultData: [ sectionFront, stationFront ],  subscriber } = setup_subscriber();

          subscriber();
          
          expect(handlePublishStationFront).to.have.been.calledOnce;
          expect(handlePublishStationFront).to.have.been.calledWith(stationFront);
          expect(handlePublishStationFront).not.to.have.been.calledWith(sectionFront);

        });

        it('saves primary and secondary lists for the station', done => {
          const
            stationSlug = 'test-e-station',
            options = { host: 'clay.radio.com' },
            { __, subscriber } = setup_subscriber({ stationSlug });

          __.retrieveList.resolves([]);

          __.handlePublishStationFront.callsFake(async page => {
            await __.handlePublishStationFront.wrappedMethod(page);
            done();

            expect(__.saveList).to.have.been.calledTwice;
            expect(__.saveList).to.have.been.calledWith('test-e-station-primary-section-fronts', [], options);
            expect(__.saveList).to.have.been.calledWith('test-e-station-secondary-section-fronts', [], options);
          });

          subscriber();
        });

        it('does not clear the station list if it already exists', done => {
          const
            stationSlug = 'radio-xyz',
            options = { host: 'clay.radio.com' },
            fakePrimaries = [{ name: 'Big Stuff', value: 'big stuff' }, { name: 'Little Stuff', value: 'little stuff' }],
            fakeSecondaries = [{ name: 'Keys', value: 'keys' }, { name: 'Whales', value: 'whales' }],
            { __, subscriber } = setup_subscriber({ stationSlug });

          __.retrieveList.onFirstCall().resolves(fakePrimaries);
          __.retrieveList.onSecondCall().resolves(fakeSecondaries);

          __.handlePublishStationFront.callsFake(async page => {
            await __.handlePublishStationFront.wrappedMethod(page);
            done();

            expect(__.saveList).to.have.been.calledWith('radio-xyz-primary-section-fronts', fakePrimaries, options);
            expect(__.saveList).to.have.been.calledWith('radio-xyz-secondary-section-fronts', fakeSecondaries, options);
          });

          subscriber();
        });

        it('logs errors if they are encountered', done => {
          const { __, subscriber } = setup_subscriber();

          __.saveList.rejects('Could not save anything.', 'I\'m sure it\'s your fault.');

          __.handlePublishStationFront.callsFake(async page => {
            await __.handlePublishStationFront.wrappedMethod(page);

            done();
            expect(__.log).to.have.been.calledWith('error', sinon.match({
              name: 'Could not save anything.',
              message:'I\'m sure it\'s your fault.'
            }));
          });

          subscriber();
        });
      });
    });
  });
});
