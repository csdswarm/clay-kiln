'use strict';
const expect = require('chai').expect,
  getPageData = require('./get-page-data');


describe('universal', () => {
  describe('analytics', () => {
    describe('get-page-data', () => {

      it('should return article', () => {
        const pathname = '/music/alternative/billie-eilish-on-why-its-a-great-time-to-be-vegan/',
          contentType = 'article',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);

        expect(pageData.page).to.equal('article');
        expect(pageData.pageName).to.equal('article');
      });

      it('should return gallery', () => {
        const pathname = '/music/alternative/billie-eilish-on-why-its-a-great-time-to-be-vegan/',
          contentType = 'gallery',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('vgallery');
        expect(pageData.pageName).to.equal('vgallery');
      });

      it('should return contest', () => {
        const pathname = '/contest/some-content-name',
          contentType = 'contest',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('contests');
        expect(pageData.pageName).to.equal('contests');
      });

      it('should return event', () => {
        const pathname = '/event/some-event-name',
          contentType = 'event',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('events');
        expect(pageData.pageName).to.equal('events');
      });

      it('should return stationDirectory', () => {
        const pathname = '/stations/some-station',
          contentType = 'some-type',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('stationsDirectory');
        expect(pageData.pageName).to.equal('stations_some-station');
      });

      it('should return station Detail', () => {
        const pathname = '/station-slug/listen',
          contentType = 'some-type',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('stationDetail');
        expect(pageData.pageName).to.equal('station-slug');
      });
      
      it('should return topic page', () => {
        const pathname = '/station-slug/topic/some-topic',
          contentType = 'some-type',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('topicPage');
        expect(pageData.pageName).to.equal('some-topic');
      });

      it('should return author page', () => {
        const pathname = '/authors/some-author',
          contentType = 'some-type',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('authorPage');
        expect(pageData.pageName).to.equal('authors_some-author');
      });

      it('should return station section front page', () => {
        const pathname = '/wearechannelq/some-section-front',
          contentType = 'some-type',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('stationSectionFront');
        expect(pageData.pageName).to.equal('some-section-front');
      });

      it('should return stationFront', () => {
        const pathname = '/wearechannelq',
          contentType = 'some-type',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('stationFront');
        expect(pageData.pageName).to.equal('wearechannelq');
      });

      it('should return rdc station front page', () => {
        const pathname = '/music/rock',
          contentType = 'some-type',
          site_slug = '',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('sectionFront');
        expect(pageData.pageName).to.equal('music_rock');
      });

      it('should return homepage', () => {
        const pathname = '/',
          contentType = 'some-type',
          site_slug = 'some_slug',
          pageData = getPageData(pathname, contentType, site_slug);
          
        expect(pageData.page).to.equal('homepage');
        expect(pageData.pageName).to.equal(undefined);
      });

      
    });
  });
});
