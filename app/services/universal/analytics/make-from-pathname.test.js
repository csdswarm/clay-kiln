'use strict';
const expect = require('chai').expect,
  makeFromPathname = require('./make-from-pathname');

describe('universal', () => {
  describe('analytics', () => {
    describe('make-from-pathname', () => {

      it('should throw an error when to object is passed by', () => {
        expect(() => makeFromPathname({})).to.throw("either 'pathname' or 'url' must be passed.");
      });
  
      it('should throw an error when both url and and pathname are present', () => {
        expect(() => makeFromPathname({ url: 'some', pathname: 'data' })).to.throw("You cannot pass both 'pathname' and 'url'");
      });

      it('should respond to some utils methods', () => {
        const fromPathname = makeFromPathname({ pathname: '/some/url' });

        expect(fromPathname).itself.to.respondTo('getPageId');
        expect(fromPathname).itself.to.respondTo('getCategory');
        expect(fromPathname).itself.to.respondTo('getGenre');
        expect(fromPathname).itself.to.respondTo('getPathname');
        expect(fromPathname).itself.to.respondTo('getTags');
        expect(fromPathname).itself.to.respondTo('isAuthorPage');
        expect(fromPathname).itself.to.respondTo('isHomepage');
        expect(fromPathname).itself.to.respondTo('isStationDetail');
        expect(fromPathname).itself.to.respondTo('isStationsDirectory');
        expect(fromPathname).itself.to.respondTo('isTopicPage');
      });

      it('should return pageId based on pageData', () => {
        const fromPathname = makeFromPathname({ pathname: '/music/alternative/billie-eilish-on-why-its-a-great-time-to-be-vegan' });

        expect(fromPathname.getPageId({ page: 'homepage', pageName : 'always-should-return-homepage' })).to.equal('homepage');
        expect(fromPathname.getPageId({ page: 'stationFront', pageName : 'always-should-return-homepage' })).to.equal('homepage');
        expect(fromPathname.getPageId({ page: 'sectionFront', pageName : 'should-return-with-sectionfront' })).to.equal('sectionfront_should-return-with-sectionfront');
        expect(fromPathname.getPageId({ page: 'stationSectionFront', pageName : 'should-return-with-sectionfront' })).to.equal('sectionfront_should-return-with-sectionfront');
        expect(fromPathname.getPageId({ page: 'topicPage', pageName : 'should-return-with-tag' })).to.equal('tag_should-return-with-tag');

        expect(fromPathname.getPageId({ page: 'article', pageName : 'articles' })).to.equal('articles_billie-eilish-on-why-its-a-great-time-to-be-vegan');
        expect(fromPathname.getPageId({ page: 'vgallery', pageName : 'galleries' })).to.equal('galleries_billie-eilish-on-why-its-a-great-time-to-be-vegan');
        expect(fromPathname.getPageId({ page: 'events', pageName : 'events' })).to.equal('events_billie-eilish-on-why-its-a-great-time-to-be-vegan');
        expect(fromPathname.getPageId({ page: 'contests', pageName : 'contests' })).to.equal('contests_billie-eilish-on-why-its-a-great-time-to-be-vegan');
      });

      it('should return an array of tags based on pageData and contentTags for articles and galleries', () => {
        const fromPathname = makeFromPathname({ pathname: '/music/alternative/billie-eilish-on-why-its-a-great-time-to-be-vegan' });

        expect(fromPathname.getTags({ page: 'article', pageName : 'this-page-name' }, ['tag1', 'tag2', 'tag3'])).to.eql(['this-page-name', ...['tag1', 'tag2', 'tag3']]);
        expect(fromPathname.getTags({ page: 'vgallery', pageName : 'this-page-name' }, ['tag1', 'tag2', 'tag3'])).to.eql(['this-page-name', ...['tag1', 'tag2', 'tag3']]);
        expect(fromPathname.getTags({ page: 'contests', pageName : 'page-name-defined' }, ['tag1', 'tag2', 'tag3'])).to.eql(['page-name-defined']);
      });

      it('should return an array with pageName for events and contests', () => {
        const fromPathname = makeFromPathname({ pathname: '/music/alternative/billie-eilish-on-why-its-a-great-time-to-be-vegan' });

        expect(fromPathname.getTags({ page: 'contests', pageName : 'page-name-defined' }, ['tag1', 'tag2', 'tag3'])).to.eql(['page-name-defined']);
        expect(fromPathname.getTags({ page: 'events', pageName : 'page-name-defined' }, ['tag1', 'tag2', 'tag3'])).to.eql(['page-name-defined']);
      });

      it('should return an array that includes sectionfront when page is Homepage or Station Front', () => {
        const fromPathname = makeFromPathname({ pathname: '/music/alternative/billie-eilish-on-why-its-a-great-time-to-be-vegan' });

        expect(fromPathname.getTags({ page: 'homepage', pageName : 'page-name-defined' }, ['tag1', 'tag2', 'tag3'])).to.eql(['sectionfront', 'homepage']);
        expect(fromPathname.getTags({ page: 'stationFront', pageName : 'page-name-defined' }, ['tag1', 'tag2', 'tag3'])).to.eql(['sectionfront', 'homepage']);
      });

      it('should return an array that includes sectionfront and pageName parts when page is a Section Front or Station Section', () => {
        const fromPathname = makeFromPathname({ pathname: '/music/alternative/billie-eilish-on-why-its-a-great-time-to-be-vegan' });

        expect(fromPathname.getTags({ page: 'sectionFront', pageName : 'page_name_defined' }, ['tag1', 'tag2', 'tag3'])).to.eql(['sectionfront', 'page', 'name', 'defined']);
        expect(fromPathname.getTags({ page: 'stationSectionFront', pageName : 'page_name_defined' }, ['tag1', 'tag2', 'tag3'])).to.eql(['sectionfront', 'page', 'name', 'defined']);
      });
    });
  });
});
