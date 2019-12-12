'use strict';

const { expect, assert } = require('chai'),
  addPermissions = require('./user-permissions'),
  locals = {
    user: {
      provider: 'cognito'
    },
    permissions: {
      article:{
        publish:{ station:{ 'NATL-RC': 1 } },
        create:{ station:{ 'NATL-RC': 1 } },
        update:{ station:{ 'NATL-RC': 1 } }
      },
      gallery:{
        publish:{ station:{ WHIO: 1, ABCD: 1 } },
        create:{ station:{ 'NATL-RC': 1 } },
        update:{ station:{ 'NATL-RC': 1 } }
      },
      'alert-banner':{
        access:{ station:{ 'NATL-RC': 1 } }
      }
    },
    station: {
      callsign: 'NATL-RC'
    }
  },
  actions = 'can,hasPermissionsTo,isAbleTo,may,will,to,include,allow'.split(','),
  targets = 'a,an,the,this,using,canUse,canModify'.split(','),
  locations = 'at,for,with,on'.split(','),
  articleCreateMessage = 'You do not have permissions to create articles.',
  galleryCreateMessage = 'You do not have permissions to publish galleries.',
  accessMessage = 'You do not have permissions to access cool magic things.';

describe('permissions', () => {
  beforeEach(() => {
    addPermissions(locals);
  });
  describe('actions', () => {
    it('pass arguments', () => {
      actions.forEach(action => {
        assert(locals.user[action]('publish', 'article').value);
        assert(locals.user[action]('publish', 'gallery', 'ABCD').value);
      });
    });
    it('chain a sentence', () => {
      assert(locals.user.include('create').an('article').value);
      assert(locals.user.can('publish').a('gallery').for('ABCD').value);
    });
  });
  describe('target', () => {
    it('pass arguments', () => {
      targets.forEach(object => {
        assert(locals.user[object]('article', 'publish').value);
        assert(locals.user[object]('gallery', 'publish', 'ABCD').value);
      });
    });
    it('chain a sentence', () => {
      assert(locals.user.using('article').isAbleTo('create').value);
      assert(locals.user.a('gallery').can('publish').for('ABCD').value);
    });
  });
  describe('locations', () => {
    it('pass arguments', () => {
      locations.forEach(location => {
        assert(locals.user[location]('NATL-RC', 'publish', 'article', ).value);
        assert(locals.user[location]('ABCD', 'publish', 'gallery').value);
      });
    });
    it('chain a sentence', () => {
      assert(locals.user.at('NATL-RC').hasPermissionsTo('publish').the('article').value);
    });
  });
  describe('messages', () => {
    it('become errors correctly', () => {
      expect(locals.user.include('create').an('article').at('ABC').message).to.eql(articleCreateMessage);
      expect(locals.user.can('publish').a('gallery').for('DEF').message).to.eql(galleryCreateMessage);
      expect(locals.user.include('access').an('cool-magic-things').message).to.eql(accessMessage);
      expect(locals.user.canModify('cool-magic-things').message).to.eql(accessMessage);
    });
    it('remain blank when valid', () => {
      expect(locals.user.include('create').an('article').message).to.eql('');
      expect(locals.user.can('publish').a('gallery').for('ABCD').message).to.eql('');
      expect(locals.user.canUse('alert-banner').message).to.eql('');
    });
  });
  describe('actions as targets', () => {
    it('overides the object string', () => {
      assert(locals.user.can({ publish: 'gallery' }).an('ignored-item').for('ABCD').value);
      expect(locals.user.can({ publish: 'gallery' }).a('ignored-item').for('DEF').message).to.eql(galleryCreateMessage);
    });
  });
});
