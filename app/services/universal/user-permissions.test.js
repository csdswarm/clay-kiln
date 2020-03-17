'use strict';

const { expect } = require('chai'),
  addPermissions = require('./user-permissions'),
  { DEFAULT_STATION } = require('./constants'),
  rdcDomainName = DEFAULT_STATION.urpsDomainName,
  locals = {
    user: {
      provider: 'cognito'
    },
    permissions: {
      [rdcDomainName]: {
        publish: {
          article: true,
          gallery: true
        },
        create: {
          article: true,
          gallery: true
        },
        update: {
          article: true,
          gallery: true
        }
      },
      'test station': {
        publish: { gallery: true }
      }
    },
    stationForPermissions: DEFAULT_STATION
  },
  actions = 'can,hasPermissionsTo,isAbleTo,may,will,to,include,allow'.split(','),
  targets = 'a,an,the,this,using,canUse,canModify'.split(','),
  locations = 'at,for,with,on'.split(','),
  articleCreateMessage = 'You do not have permissions to create articles.',
  galleryCreateMessage = 'You do not have permissions to publish galleries.';

describe('permissions', () => {
  beforeEach(() => {
    addPermissions(locals);
  });
  describe('actions', () => {
    it('pass arguments', () => {
      actions.forEach(action => {
        expect(locals.user[action]('publish', 'article').value).to.be.true;
        expect(locals.user[action]('publish', 'gallery', 'test station').value).to.be.true;
      });
    });
    it('chain a sentence', () => {
      expect(locals.user.include('create').an('article').value).to.be.true;
      expect(locals.user.can('publish').a('gallery').for('test station').value).to.be.true;
    });
  });
  describe('target', () => {
    it('pass arguments', () => {
      targets.forEach(object => {
        expect(locals.user[object]('article', 'publish').value).to.be.true;
        expect(locals.user[object]('gallery', 'publish', 'test station').value).to.be.true;
      });
    });
    it('chain a sentence', () => {
      expect(locals.user.using('article').isAbleTo('create').value).to.be.true;
      expect(locals.user.a('gallery').can('publish').for('test station').value).to.be.true;
    });
  });
  describe('locations', () => {
    it('pass arguments', () => {
      locations.forEach(location => {
        expect(locals.user[location](rdcDomainName, 'publish', 'article', ).value).to.be.true;
        expect(locals.user[location]('test station', 'publish', 'gallery').value).to.be.true;
      });
    });
    it('chain a sentence', () => {
      expect(locals.user.at(rdcDomainName).hasPermissionsTo('publish').the('article').value).to.be.true;
    });
  });
  describe('messages', () => {
    it('become errors correctly', () => {
      expect(locals.user.include('create').an('article').at('ABC').message).to.equal(articleCreateMessage);
      expect(locals.user.can('publish').a('gallery').for('DEF').message).to.equal(galleryCreateMessage);
    });
    it('remain blank when valid', () => {
      expect(locals.user.include('create').an('article').message).to.equal('');
      expect(locals.user.can('publish').a('gallery').for('test station').message).to.equal('');
    });
  });
  describe('actions as targets', () => {
    it('overides the object string', () => {
      expect(locals.user.can({ publish: 'gallery' }).an('ignored-item').for('test station').value).to.be.true;
      expect(locals.user.can({ publish: 'gallery' }).a('ignored-item').for('DEF').message).to.equal(galleryCreateMessage);
    });
  });
});
