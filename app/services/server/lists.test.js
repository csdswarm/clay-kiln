'use strict';

const
  lists = require('./lists').injectable(),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),

  { expect } = chai;

chai.use(sinonChai);

describe('server', () => {
  afterEach(sinon.restore);

  describe('lists', () => {
    function setup_lists() {
      const { internals: _ } = lists,
        locals = {
          site: { host: 'http://domain.com' },
          lists: {
            'list-a': [
              { name: 'some-item', text: 'some text' }
            ]
          }
        };
      
      sinon.stub(_.db);
      _.redis = sinon.stub({ del() {}, get() {}, set() {} });
      sinon.stub(_, 'log');

      sinon.spy(_, 'getFromLocals');
      sinon.spy(_, 'getFromCache');
      sinon.spy(_, 'getFromDb');
      sinon.spy(_, 'saveToCache');
      sinon.spy(_, 'saveToLocals');

      return { _, locals, ...lists };
    }
    
    describe('addListItem', () => {
      function setup_addListItem() {
        const { addListItem, _, locals } = setup_lists();
        
        locals.lists['my-list'] = [
          { key: 'a-key', value: 'a value' }
        ];
        
        _.db.get.resolves([]);
        _.redis.get.resolves('[]');
        
        return { addListItem, _, locals };
      }

      it('adds a new item to the list and returns the item added', async () => {
        const { addListItem, _, locals } = setup_addListItem(),
          item = { key: 'some-key', value: 'some value' },
          result = await addListItem('my-list', item, locals);

        expect(result).to.equal(item);
        expect(locals.lists['my-list']).to.include(item);
        expect(_.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/my-list',
          '[{"key":"a-key","value":"a value"},{"key":"some-key","value":"some value"}]'
        );
        expect(_.redis.set).to.have.been.calledWith(
          'list:my-list',
          '[{"key":"a-key","value":"a value"},{"key":"some-key","value":"some value"}]',
          'EX',
          360
        );
      });

      it('has no sense of keys, use updateListItem to change a value instead', async () => {
        const { addListItem, _, locals } = setup_addListItem(),
          item = { key: 'a-key', value: 'new value' },
          result = await addListItem('my-list', item, locals);

        expect(result).to.equal(item);
        expect(locals.lists['my-list']).to.include(item);
        expect(_.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/my-list',
          '[{"key":"a-key","value":"a value"},{"key":"a-key","value":"new value"}]'
        );
        expect(_.redis.set).to.have.been.calledWith(
          'list:my-list',
          '[{"key":"a-key","value":"a value"},{"key":"a-key","value":"new value"}]',
          'EX',
          360
        );
      });

      it('does not add the item if it already exists and returns undefined', async () => {
        const { addListItem, _, locals } = setup_addListItem(),
          item = { key: 'a-key', value: 'a value' },
          result = await addListItem( 'my-list', item, locals);

        expect(result).to.be.undefined;
        expect(_.db.put).not.to.have.been.called;
        expect(_.redis.set).not.to.have.been.called;
      });
      
    });

    describe('deleteListItem', () => {
      function setup_deleteListItem() {
        const { deleteListItem, _, locals } = setup_lists();

        locals.lists['my-list'] = [
          { name: 'First Item', value: 'first item' },
          { name: 'Second Item', value: '2nd' }
        ];

        return { deleteListItem, _, locals };
      }

      it('deletes a matching list item from the list and returns a list of what was deleted', async () => {
        const { deleteListItem, _, locals } = setup_deleteListItem(),
          item = locals.lists['my-list'][0],
          result = await deleteListItem('my-list', item, locals);

        expect(result).to.include(item);
        expect(locals.lists['my-list']).not.to.include(item);
        expect(_.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/my-list',
          '[{"name":"Second Item","value":"2nd"}]'
        );
        expect(_.redis.set).to.have.been.calledWith(
          'list:my-list',
          '[{"name":"Second Item","value":"2nd"}]'
        );
      });

      it('deletes items with a matcher fn and returns a list of what was deleted', async () => {
        const { deleteListItem, _, locals } = setup_deleteListItem(),
          removeFn = item => item.value.startsWith('2'),
          itemToRemove = locals.lists['my-list'].find(removeFn),
          result = await deleteListItem('my-list', removeFn, locals);

        expect(result).to.include(itemToRemove);
        expect(locals.lists['my-list']).not.to.include(itemToRemove);
        expect(_.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/my-list',
          '[{"name":"First Item","value":"first item"}]'
        );
        expect(_.redis.set).to.have.been.calledWith(
          'list:my-list',
          '[{"name":"First Item","value":"first item"}]'
        );
      });

      it('returns an empty array if nothing was deleted', async () => {
        const { deleteListItem, _, locals } = setup_deleteListItem(),
          removeFn = () => false,
          itemToRemove = { name: 'Value', value: 'Does not exist in list' },
          result1 = await deleteListItem('my-list', removeFn, locals),
          result2 = await deleteListItem('my-list', itemToRemove, locals);

        expect(result1).to.eql([]);
        expect(result2).to.eql([]);
        expect(_.db.put).not.to.have.been.called;
        expect(_.redis.set).not.to.have.been.called;
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
        const { retrieveList,_, locals } = setup_lists();
        
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

        return { retrieveList, _, locals };
      }

      it('tries to get the list from locals first', async () => {
        const { retrieveList, _, locals } = setup_retrieveList(),
          result = await retrieveList('my-list', locals);

        expect(result).to.equal(locals.lists['my-list']);
        expect(_.getFromLocals).to.have.been.calledOnce;
        expect(_.getFromLocals).to.have.been.calledWith('my-list', locals);
        expect(_.getFromCache).to.not.have.been.called;
      });

      it('checks redis if the list is not in locals', async () => {
        const { retrieveList, _, locals } = setup_retrieveList(),
          list = locals.lists['other-list'],
          cacheList = JSON.stringify([...list]);

        _.redis.get.resolves(cacheList);

        const result = await retrieveList('not-in-locals', locals);

        expect(result).to.eql(list);
        expect(_.getFromCache).to.have.been.calledOnce;
        expect(_.getFromCache).to.have.been.calledWith('not-in-locals');
        expect(_.redis.get).to.have.been.calledOnce;
        expect(_.redis.get).to.have.been.calledWith('list:not-in-locals');
        expect(_.getFromDb).to.not.have.been.called;
      });

      it('checks the db if not found in locals or redis cache and saves to locals and cache', async () => {
        const { retrieveList, _, locals } = setup_retrieveList(),
          LIST_NAME = 'not-in-locals-or-redis',

          list = locals.lists['other-list'],
          listCopy = JSON.parse(JSON.stringify([...list]));

        sinon.stub(_, 'CACHE_TTL').value(60),

        _.redis.get.resolves(null);
        _.db.get.resolves(listCopy);

        const result = await retrieveList(LIST_NAME, locals);

        expect(result).to.eql(list);
        expect(result).not.to.equal(list);

        expect(_.getFromCache).to.have.been.called;

        expect(_.getFromDb).to.have.been.calledOnce;
        expect(_.getFromDb).to.have.been.calledWith(LIST_NAME, locals);
        expect(_.db.get).to.have.been.calledWith(`http://domain.com/_lists/${LIST_NAME}`);

        expect(_.saveToCache).to.have.been.calledWith(LIST_NAME, listCopy);
        expect(_.redis.set).to.have.been.calledWith(`list:${LIST_NAME}`, JSON.stringify(listCopy), 'EX', 60);

        expect(_.saveToLocals).to.have.been.calledWith(LIST_NAME, locals, listCopy);
        expect(locals.lists).to.have.property(LIST_NAME).that.eqls(listCopy);

        delete locals.lists[LIST_NAME];
      });

      it('logs an error when there is an issue loading from db or saving', async () => {
        const { retrieveList, _, locals } = setup_retrieveList(),
          ERROR = 'some error';

        _.redis.get.resolves(null);
        _.db.get.throws(ERROR);

        await retrieveList('not-in-locals', locals);

        expect(_.log).to.have.been.calledWith('error', 'Error retrieving list', sinon.match({ name: ERROR }));

      });

      it('is station aware for some lists', async () => {
        const { retrieveList, _, locals } = setup_retrieveList(),
          localsCopy = { ...JSON.parse(JSON.stringify(locals)), stationForPermissions: { site_slug: 'kxyz' } };

        sinon.stub(_, 'STATION_AWARE').value({ 'my-list': true });

        const result = await retrieveList('my-list', localsCopy);

        expect(result).to.eql(locals.lists['kxyz-my-list']);
      });

    });
    
    describe('saveList', () => {
      function setup_saveList() {
        const { saveList, _, locals } = setup_lists();

        locals.lists = {
          'existing-list': [
            { name: 'a-key', value: 'a value' }
          ]
        };

        _.db.get.resolves([]);
        _.redis.get.resolves('[]');

        return { saveList, _, locals };
      }

      it('saves over an existing list if it already exists', async () => {
        const { saveList, _, locals } = setup_saveList(),
          newList = [{ key: 'Stuff', value: 'Things' }, { key: 'Bozo', value: 'The Clown' }];

        await saveList('existing-list', newList, locals);

        expect(locals.lists).to.have.property('existing-list').that.equals(newList);
        expect(_.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/existing-list',
          JSON.stringify(newList)
        );
        expect(_.redis.set).to.have.been.calledWith(
          'list:existing-list',
          JSON.stringify(newList),
        );

      });

      it('adds and saves a new list if one does not already exist', async () => {
        const { saveList, _, locals } = setup_saveList(),
          listToSave = [{ key: 'Stuff', value: 'Things' }, { key: 'Bozo', value: 'The Clown' }];

        await saveList('my-new-list', listToSave, locals);

        expect(locals.lists).to.have.property('my-new-list').that.equals(listToSave);
        expect(_.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/my-new-list',
          JSON.stringify(listToSave)
        );
        expect(_.redis.set).to.have.been.calledWith(
          'list:my-new-list',
          '[{"key":"Stuff","value":"Things"},{"key":"Bozo","value":"The Clown"}]',
        );
      });
    });

    describe('uncacheList', () => {
      function setup_uncacheList() {
        const { uncacheList, _, locals } = setup_lists();
        
        locals.lists = {
          'my-list': [
            { name: 'First', value: 'one' },
            { name: 'Second', value: 'two' }
          ],
          'other-list': [
            { text: 'A', count: 5 },
            { text: 'B', count: 50 }
          ]
        };

        return { uncacheList, _, locals };
      }

      it('removes the list from locals and cache', async () => {
        const { uncacheList, _, locals } = setup_uncacheList(),
          newLocals = JSON.parse(JSON.stringify(locals));

        expect(newLocals.lists).to.have.property('other-list');

        await uncacheList('other-list', newLocals);

        expect(_.redis.del).to.have.been.calledWith('list:other-list');
        expect(newLocals.lists).to.not.have.property('other-list');
      });
    });
    
    describe('updateListItem', () => {
      function standardSetup() {
        const { updateListItem, _, locals } = setup_lists();
        
        locals.lists.test = [
          { id: 'a', value: 'A' },
          { id: 'a', value: 'AAAAA' },
          { id: 'b', value: 'meh' }
        ];

        return { updateListItem, _, locals };
      }

      it('updates an existing item based on key and returns the change', async () => {
        const { updateListItem, _, locals } = standardSetup(),
          newItem = { id: 'b', value: 'stuff' },
          result = await updateListItem('test', newItem, 'id', locals);

        expect(result).to.have.property('from').that.eqls({ id: 'b', value: 'meh' });
        expect(result).to.have.property('to').that.eqls(newItem);

        expect(locals.lists.test.length).to.equal(3);
        expect(locals.lists.test[2].value).to.equal('stuff');

        expect(_.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"}]'
        );
        // and also
        expect(_.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"},{"id":"b","value":"stuff"}]'
        );

        expect(_.redis.set).to.have.been.calledWith(
          'list:test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"}]'
        );
        // and also
        expect(_.redis.set).to.have.been.calledWith(
          'list:test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"},{"id":"b","value":"stuff"}]'
        );
      });

      it('adds an item if it did not already exist and returns the change', async () => {
        const { updateListItem, _, locals } = standardSetup(),
          newItem = { id: 'c', value: 'new stuff' },
          result = await updateListItem('test', newItem, 'id', locals);
        
        expect(result).not.to.have.property('from');
        expect(result).to.have.property('to').that.eqls(newItem);
        expect(locals.lists.test.length).to.equal(4);
        expect(locals.lists.test).to.include(newItem);
        expect(_.db.put).to.have.been.calledWith(
          'http://domain.com/_lists/test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"},{"id":"b","value":"meh"},{"id":"c","value":"new stuff"}]'
        );
        expect(_.db.put).not.to.have.been.calledTwice;
        expect(_.redis.set).to.have.been.calledWith(
          'list:test',
          '[{"id":"a","value":"A"},{"id":"a","value":"AAAAA"},{"id":"b","value":"meh"},{"id":"c","value":"new stuff"}]'
        );
        expect(_.redis.set).not.to.have.been.calledTwice;
      });

      it('returns an empty object if nothing changed', async () => {
        const { updateListItem, _, locals } = standardSetup(),
          sameItem = { ...locals.lists.test[2] },
          result = await updateListItem('test', sameItem, 'id', locals);

        expect(result).not.to.have.property('from');
        expect(result).not.to.have.property('to');
        expect(_.db.put).not.to.have.been.called;
        expect(_.redis.set).not.to.have.been.called;
      });

      it('logs an error if there is more than one item in the list with the specified key', async () => {
        const { updateListItem, _, locals } = standardSetup(),
          itemToUpdate = { id: 'a', value: 'does not matter' },
          result = await updateListItem('test', itemToUpdate, 'id', locals);

        expect(result).to.be.undefined;
        expect(_.log).to.have.been.calledWith('error', sinon.match(/Too many items contain the same key. Can\'t update/));
      });
    });
  });
});
