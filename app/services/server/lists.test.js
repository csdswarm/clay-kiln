'use strict';

const
  lists = require('./lists').injectable(),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  { expect } = chai;

chai.use(sinonChai);

describe('server', () => {
  describe('lists', () => {

    describe('getSectionFrontName', () => {
      const { getSectionFrontName } = lists,
        sectionFrontsList = [
          { name: 'A', value: 'a' },
          { name: 'Stuff', value: 'things' },
          { name: 'B', value: 'b' }
        ];

      it('gets the section front name given a value', () => {
        const result = getSectionFrontName('things', sectionFrontsList);

        expect(result).to.equal('Stuff');
      });

      it('returns the slug if the name is not found', () => {
        const result = getSectionFrontName('news', sectionFrontsList);

        expect(result).to.equal('news');
      });
    });

    describe('retrieveList', () => {
      const { retrieveList, internals: _ } = lists,
        locals = {
          site: {
            host: 'https://domain.com'
          },
          lists: {
            'my-list': [
              { name: 'First', value: 'one' },
              { name: 'Second', value: 'two' }
            ],
            'other-list': [
              { text: 'A', count: 5 },
              { text: 'B', count: 50 }
            ],
            'kxyz-my-list': [
              { name: 'First', value: '1st' },
              { name: 'Second', value: '2nd' }
            ]
          }
        };

      // override redis to prevent connection errors.
      Object.defineProperty(_, 'redis', {
        configurable: true, enumerable: true, writable: true, value: { get() {}, set() {}, del() {} }
      });


      afterEach(sinon.restore);

      it('tries to get the list from locals first', async () => {
        const getFromLocals = sinon.spy(_, 'getFromLocals'),
          getFromCache = sinon.spy(_, 'getFromCache'),
          result = await retrieveList('my-list', locals);

        expect(result).to.equal(locals.lists['my-list']);
        expect(getFromLocals).to.have.been.calledOnce;
        expect(getFromLocals).to.have.been.calledWith('my-list', locals);
        expect(getFromCache).to.not.have.been.called;
      });

      it('checks redis if the list is not in locals', async () => {
        const getFromCache = sinon.spy(_, 'getFromCache'),
          redisGet = sinon.stub(_.redis, 'get'),
          getFromDb = sinon.spy(_, 'getFromDb'),
          list = locals.lists['other-list'],
          cacheList = JSON.stringify([...list]);

        redisGet.resolves(cacheList);

        const result = await retrieveList('not-in-locals', locals);

        expect(result).to.eql(list);
        expect(getFromCache).to.have.been.calledOnce;
        expect(getFromCache).to.have.been.calledWith('not-in-locals');
        expect(redisGet).to.have.been.calledOnce;
        expect(redisGet).to.have.been.calledWith('list:not-in-locals');
        expect(getFromDb).to.not.have.been.called;
      });

      it('checks the db if not found in locals or redis cache and saves to locals and cache', async () => {
        const
          LIST_NAME = 'not-in-locals-or-redis',

          dbGet = sinon.stub(_.db, 'get'),
          redisGet = sinon.stub(_.redis, 'get'),
          list = locals.lists['other-list'],
          listCopy = JSON.parse(JSON.stringify([...list]));

        sinon.stub(_, 'CACHE_TTL').value(60),

        redisGet.resolves(null);
        dbGet.resolves(listCopy);

        sinon.spy(_, 'getFromCache');
        sinon.spy(_, 'getFromDb');
        sinon.stub(_.redis, 'set');
        sinon.spy(_, 'saveToCache');
        sinon.spy(_, 'saveToLocals');

        const result = await retrieveList(LIST_NAME, locals);

        expect(result).to.eql(list);
        expect(result).not.to.equal(list);

        expect(_.getFromCache).to.have.been.called;

        expect(_.getFromDb).to.have.been.calledOnce;
        expect(_.getFromDb).to.have.been.calledWith(LIST_NAME, locals);
        expect(dbGet).to.have.been.calledWith(`https://domain.com/_lists/${LIST_NAME}`);

        expect(_.saveToCache).to.have.been.calledWith(LIST_NAME, listCopy);
        expect(_.redis.set).to.have.been.calledWith(`list:${LIST_NAME}`, JSON.stringify(listCopy), 'EX', 60);

        expect(_.saveToLocals).to.have.been.calledWith(LIST_NAME, locals, listCopy);
        expect(locals.lists).to.have.property(LIST_NAME).that.eqls(listCopy);

        delete locals.lists[LIST_NAME];
      });

      it('logs an error when there is an issue loading from db or saving', async () => {
        const
          redisGet = sinon.stub(_.redis, 'get'),
          dbGet = sinon.stub(_.db, 'get'),
          ERROR = 'some error';

        redisGet.resolves(null);
        dbGet.throws(ERROR);

        sinon.stub(_, 'log'),

        await retrieveList('not-in-locals', locals);

        expect(_.log).to.have.been.calledWith('error', 'Error retrieving list', sinon.match({ name: ERROR }));

      });

    });

    describe('uncacheList', () => {
      const { uncacheList, internals: _ } = lists,
        locals = {
          lists: {
            'my-list': [
              { name: 'First', value: 'one' },
              { name: 'Second', value: 'two' }
            ],
            'other-list': [
              { text: 'A', count: 5 },
              { text: 'B', count: 50 }
            ]
          }
        };

      afterEach(sinon.restore);

      it('removes the list from locals and cache', async () => {
        const
          newLocals = JSON.parse(JSON.stringify(locals));

        sinon.stub(_.redis, 'del');

        expect(newLocals.lists).to.have.property('other-list');

        await uncacheList('other-list', newLocals);

        expect(_.redis.del).to.have.been.calledWith('list:other-list');
        expect(newLocals.lists).to.not.have.property('other-list');
      });
    });
  });
});
