'use strict';

const { expect, assert } = require('chai'),
  addPermissions = require('./user-permissions'),
  user = {
    permissions: {
      article:{
        publish:{station:{'NATL-RC': 1}},
        create:{station:{'NATL-RC': 1}},
        update:{station:{'NATL-RC': 1}}
      },
      gallery:{
        publish:{station:{WHIO: 1, ABCD: 1}},
        create:{station:{'NATL-RC': 1}},
        update:{station:{'NATL-RC': 1}}
      },
      'alert-banner':{
        any:{station:{'NATL-RC': 1}}
      }
    }
  },
  actions = 'can,hasPermissionsTo,isAbleTo,may,will,to,include,allow'.split(','),
  objects = 'a,an,the,this,using,canUse,canModify'.split(','),
  locations = 'at,for,with,on'.split(','),
  articleCreateMessage = 'You do not have permissions to create articles.',
  galleryCreateMessage = 'You do not have permissions to publish galleries.',
  AnyMessage = 'You do not have permissions to cool magic things.';

addPermissions(user);

describe('permissions', () => {
  describe('actions', () => {
    it('pass arguments', () => {
      actions.forEach(action => {
        assert(user[action]('publish', 'article', 'NATL-RC').value);
        assert(user[action]('publish', 'gallery', 'ABCD').value);
      });
    });
    it('chain a sentence', () => {
      assert(user.include('create').an('article').at('NATL-RC').value);
      assert(user.can('publish').a('gallery').for('ABCD').value);
    });
  });
  describe('objects', () => {
    it('pass arguments', () => {
      objects.forEach(object => {
        assert(user[object]('article', 'publish', 'NATL-RC').value);
        assert(user[object]('gallery', 'publish', 'ABCD').value);
      });
    });
    it('chain a sentence', () => {
      assert(user.using('article').isAbleTo('create').at('NATL-RC').value);
      assert(user.a('gallery').can('publish').for('ABCD').value);
    });
  });
  describe('locations', () => {
    it('pass arguments', () => {
      locations.forEach(location => {
        assert(user[location]('NATL-RC', 'publish', 'article', ).value);
        assert(user[location]('ABCD', 'publish', 'gallery').value);
      });
    });
    it('chain a sentence', () => {
      assert(user.at('NATL-RC').hasPermissionsTo('publish').the('article').value);
    });
  });
  describe('messages', () => {
    it('become errors correctly', () => {
      expect(user.include('create').an('article').at('ABC').message).to.eql(articleCreateMessage);
      expect(user.can('publish').a('gallery').for('DEF').message).to.eql(galleryCreateMessage);
      expect(user.include('any').an('cool-magic-things').message).to.eql(AnyMessage);
    });
    it('remain blank when valid', () => {
      expect(user.include('create').an('article').at('NATL-RC').message).to.eql('');
      expect(user.can('publish').a('gallery').for('ABCD').message).to.eql('');
      expect(user.canUse('alert-banner').message).to.eql('');
    });
  });
});
