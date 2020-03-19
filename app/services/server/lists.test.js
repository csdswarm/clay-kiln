'use strict';

const
  lists = require('./lists'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  { expect } = chai;

chai.use(sinonChai);

describe('server', () => {
  afterEach(sinon.restore);

  describe('lists', () => {
    function setup_lists() {
      const { __ } = lists,
        locals = {
          site: { host: 'http://domain.com' },
          lists: {
            'list-a': [
              { name: 'some-item', text: 'some text' }
            ]
          }
        };
      
      sinon.stub(__.db);
      __.redis = sinon.stub({ del() {}, get() {}, set() {} });
      sinon.stub(__, 'log');

      sinon.spy(__, 'getFromLocals');
      sinon.spy(__, 'getFromCache');
      sinon.spy(__, 'getFromDb');
      sinon.spy(__, 'saveToCache');
      sinon.spy(__, 'saveToLocals');

      return { __, locals, ...lists };
    }
    
    describe('addListItem', () => {
      function setup_addListItem() {
        const { addListItem, __, locals } = setup_lists();
        
        locals.lists['my-list'] = [
          { key: 'a-key', value: 'a value' }
        ];
        
        __.db.get.resolves([]);
        __.redis.get.resolves('[]');
        
        return { addListItem, __, locals };
      }

      it('adds a new item to the list and returns the item added', async () => {
        const { addListItem, __, locals } = setup_addListItem(),
          item = { key: 'some-key', value: 'some value' },
          result = await addListItem('my-list', item, { locals });

        expect(result).to.equal(item);
        expect(locals.lists['my-list']).to.include(item);
        expect(__.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/my-list',
          '[{"key":"a-key","value":"a value"},{"key":"some-key","value":"some value"}]'
        );
        expect(__.redis.set).to.have.been.calledWith(
          'list:my-list',
          '[{"key":"a-key","value":"a value"},{"key":"some-key","value":"some value"}]',
          'EX',
          3600
        );
      });

      it('has no sense of keys, use updateListItem to change a value instead', async () => {
        const { addListItem, __, locals } = setup_addListItem(),
          item = { key: 'a-key', value: 'new value' },
          result = await addListItem('my-list', item, { locals });

        expect(result).to.equal(item);
        expect(locals.lists['my-list']).to.include(item);
        expect(__.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/my-list',
          '[{"key":"a-key","value":"a value"},{"key":"a-key","value":"new value"}]'
        );
        expect(__.redis.set).to.have.been.calledWith(
          'list:my-list',
          '[{"key":"a-key","value":"a value"},{"key":"a-key","value":"new value"}]',
          'EX',
          3600
        );
      });

      it('does not add the item if it already exists and returns undefined', async () => {
        const { addListItem, __, locals } = setup_addListItem(),
          item = { key: 'a-key', value: 'a value' },
          result = await addListItem( 'my-list', item, { locals });

        expect(result).to.be.undefined;
        expect(__.db.put).not.to.have.been.called;
        expect(__.redis.set).not.to.have.been.called;
      });
      
    });

    describe('deleteListItem', () => {
      function setup_deleteListItem() {
        const { deleteListItem, __, locals } = setup_lists();

        locals.lists['my-list'] = [
          { name: 'First Item', value: 'first item' },
          { name: 'Second Item', value: '2nd' }
        ];

        return { deleteListItem, __, locals };
      }

      it('deletes a matching list item from the list and returns a list of what was deleted', async () => {
        const { deleteListItem, __, locals } = setup_deleteListItem(),
          item = locals.lists['my-list'][0],
          result = await deleteListItem('my-list', item, { locals });

        expect(result).to.include(item);
        expect(locals.lists['my-list']).not.to.include(item);
        expect(__.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/my-list',
          '[{"name":"Second Item","value":"2nd"}]'
        );
        expect(__.redis.set).to.have.been.calledWith(
          'list:my-list',
          '[{"name":"Second Item","value":"2nd"}]'
        );
      });

      it('deletes items with a matcher fn and returns a list of what was deleted', async () => {
        const { deleteListItem, __, locals } = setup_deleteListItem(),
          removeFn = item => item.value.startsWith('2'),
          itemToRemove = locals.lists['my-list'].find(removeFn),
          result = await deleteListItem('my-list', removeFn, { locals });

        expect(result).to.include(itemToRemove);
        expect(locals.lists['my-list']).not.to.include(itemToRemove);
        expect(__.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/my-list',
          '[{"name":"First Item","value":"first item"}]'
        );
        expect(__.redis.set).to.have.been.calledWith(
          'list:my-list',
          '[{"name":"First Item","value":"first item"}]'
        );
      });

      it('returns an empty array if nothing was deleted', async () => {
        const { deleteListItem, __, locals } = setup_deleteListItem(),
          removeFn = () => false,
          itemToRemove = { name: 'Value', value: 'Does not exist in list' },
          result1 = await deleteListItem('my-list', removeFn, { locals }),
          result2 = await deleteListItem('my-list', itemToRemove, { locals });

        expect(result1).to.eql([]);
        expect(result2).to.eql([]);
        expect(__.db.put).not.to.have.been.called;
        expect(__.redis.set).not.to.have.been.called;
      });
    });
        
    describe('getSectionFrontName', () => {
      function setup_getSectionFrontName() {
        const { getSectionFrontName } = setup_lists(),
          sectionFrontsList = [
            { name: 'A', value: 'a' },
            { name: 'Stuff', value: 'things' },
            { name: 'B', value: 'b' }
          ];
        
        return { getSectionFrontName, sectionFrontsList };
      }

      it('gets the section front name given a value', () => {
        const { getSectionFrontName, sectionFrontsList } = setup_getSectionFrontName(),
          result = getSectionFrontName('things', sectionFrontsList);

        expect(result).to.equal('Stuff');
      });

      it('returns the slug if the name is not found', () => {
        const { getSectionFrontName, sectionFrontsList } = setup_getSectionFrontName(),
          result = getSectionFrontName('news', sectionFrontsList);

        expect(result).to.equal('news');
      });
    });

    describe('retrieveList', () => {
      function setup_retrieveList() {
        const { retrieveList,__, locals } = setup_lists();
        
        locals.lists = {
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
        };

        return { retrieveList, __, locals };
      }

      it('tries to get the list from locals first', async () => {
        const { retrieveList, __, locals } = setup_retrieveList(),
          result = await retrieveList('my-list', { locals });

        expect(result).to.equal(locals.lists['my-list']);
        expect(__.getFromLocals).to.have.been.calledOnce;
        expect(__.getFromLocals).to.have.been.calledWith('my-list', locals);
        expect(__.getFromCache).to.not.have.been.called;
      });

      it('checks redis if the list is not in locals', async () => {
        const { retrieveList, __, locals } = setup_retrieveList(),
          list = locals.lists['other-list'],
          cacheList = JSON.stringify([...list]);

        __.redis.get.resolves(cacheList);

        const result = await retrieveList('not-in-locals', { locals });

        expect(result).to.eql(list);
        expect(__.getFromCache).to.have.been.calledOnce;
        expect(__.getFromCache).to.have.been.calledWith('not-in-locals');
        expect(__.redis.get).to.have.been.calledOnce;
        expect(__.redis.get).to.have.been.calledWith('list:not-in-locals');
        expect(__.getFromDb).to.not.have.been.called;
      });

      it('checks the db if not found in locals or redis cache and saves to locals and cache', async () => {
        const { retrieveList, __, locals } = setup_retrieveList(),
          LIST_NAME = 'not-in-locals-or-redis',

          list = locals.lists['other-list'],
          listCopy = JSON.parse(JSON.stringify([...list]));

        sinon.stub(__, 'CACHE_TTL').value(60),

        __.redis.get.resolves(null);
        __.db.get.resolves(listCopy);

        const result = await retrieveList(LIST_NAME, { locals });

        expect(result).to.eql(list);
        expect(result).not.to.equal(list);

        expect(__.getFromCache).to.have.been.called;

        expect(__.getFromDb).to.have.been.calledOnce;
        expect(__.getFromDb).to.have.been.calledWith(LIST_NAME, locals.site.host);
        expect(__.db.get).to.have.been.calledWith(`http://domain.com/_lists/${LIST_NAME}`);

        expect(__.saveToCache).to.have.been.calledWith(LIST_NAME, listCopy);
        expect(__.redis.set).to.have.been.calledWith(`list:${LIST_NAME}`, JSON.stringify(listCopy), 'EX', 60);

        expect(__.saveToLocals).to.have.been.calledWith(LIST_NAME, locals, listCopy);
        expect(locals.lists).to.have.property(LIST_NAME).that.eqls(listCopy);

        delete locals.lists[LIST_NAME];
      });

      it('logs an error when there is an issue loading from db or saving', async () => {
        const { retrieveList, __, locals } = setup_retrieveList(),
          ERROR = 'some error';

        __.redis.get.resolves(null);
        __.db.get.throws(ERROR);

        await retrieveList('not-in-locals', { locals });

        expect(__.log).to.have.been.calledWith('error', 'Error retrieving list', sinon.match({ name: ERROR }));

      });

      it('is station aware for some lists', async () => {
        const { retrieveList, __, locals } = setup_retrieveList(),
          localsCopy = { ...JSON.parse(JSON.stringify(locals)), stationForPermissions: { site_slug: 'kxyz' } };

        sinon.stub(__, 'STATION_LISTS').value({ 'my-list': true });

        const result = await retrieveList('my-list', { locals: localsCopy });

        expect(result).to.eql(locals.lists['kxyz-my-list']);
      });

    });

    describe('updateListItem', () => {
      function standardSetup() {
        const { updateListItem, __, locals } = setup_lists();
        
        locals.lists.test = [
          { id: 'a', value: 'A' },
          { id: 'a', value: 'AAAAA' },
          { id: 'b', value: 'meh' }
        ];

        return { updateListItem, __, locals };
      }

      it('updates an existing item based on key and returns the change', async () => {
        const { updateListItem, __, locals } = standardSetup(),
          newItem = { id: 'b', value: 'stuff' },
          result = await updateListItem('test', newItem, 'id', { locals });

        expect(result).to.have.property('from').that.eqls({ id: 'b', value: 'meh' });
        expect(result).to.have.property('to').that.eqls(newItem);

        expect(locals.lists.test.length).to.equal(3);
        expect(locals.lists.test[2].value).to.equal('stuff');

        expect(__.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"}]'
        );
        // and also
        expect(__.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"},{"id":"b","value":"stuff"}]'
        );

        expect(__.redis.set).to.have.been.calledWith(
          'list:test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"}]'
        );
        // and also
        expect(__.redis.set).to.have.been.calledWith(
          'list:test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"},{"id":"b","value":"stuff"}]'
        );
      });

      it('adds an item if it did not already exist and returns the change', async () => {
        const { updateListItem, __, locals } = standardSetup(),
          newItem = { id: 'c', value: 'new stuff' },
          result = await updateListItem('test', newItem, 'id', { locals });
        
        expect(result).not.to.have.property('from');
        expect(result).to.have.property('to').that.eqls(newItem);
        expect(locals.lists.test.length).to.equal(4);
        expect(locals.lists.test).to.include(newItem);
        expect(__.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"},{"id":"b","value":"meh"},{"id":"c","value":"new stuff"}]'
        );
        expect(__.db.put).not.to.have.been.calledTwice;
        expect(__.redis.set).to.have.been.calledWith(
          'list:test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"},{"id":"b","value":"meh"},{"id":"c","value":"new stuff"}]'
        );
        expect(__.redis.set).not.to.have.been.calledTwice;
      });

      it('returns an empty object if nothing changed', async () => {
        const { updateListItem, __, locals } = standardSetup(),
          sameItem = { ...locals.lists.test[2] },
          result = await updateListItem('test', sameItem, 'id', { locals });

        expect(result).not.to.have.property('from');
        expect(result).not.to.have.property('to');
        expect(__.db.put).not.to.have.been.called;
        expect(__.redis.set).not.to.have.been.called;
      });

      it('logs an error if there is more than one item in the list with the specified key', async () => {
        const { updateListItem, __, locals } = standardSetup(),
          itemToUpdate = { id: 'a', value: 'does not matter' },
          result = await updateListItem('test', itemToUpdate, 'id', { locals });

        expect(result).to.be.undefined;
        expect(__.log).to.have.been.calledWith('error', sinon.match(/Too many items contain the same key. Can\'t update/));
      });
    });
  });
});
