'use strict';
// Stub out window, locals, and published station fronts
const slugList = [ 'someValidSlug', 'anotherValidSlug' ],
  testSlugs = {};

// First slug is published, second is not
testSlugs[slugList[0]] = true;
testSlugs[slugList[1]] = false;

global.window = {
  kiln: {
    locals: {
      allStationsSlugs: slugList,
      site: {
        host: 'clay.radio.com',
        protocol: 'https'
      }
    }
  }
};

const dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  lib = require('./station-slug');

describe(dirname, function () {
  describe(filename, function () {
    describe('validate', async function () {
      const fn = lib[this.title];

      it('doesn\'t do anything if there\'s no section-front component', async function () {
        const state = { components: {
          'www.domain.com/_components/some-other-component/instances/a': {}
        } };

        expect(await fn(state, testSlugs)).to.eql([]);
      });

      it('doesn\'t do anything if there\'s no stationSiteSlug field', async function () {
        const state = { components: {
          'www.domain.com/_components/section-front/instances/a': {}
        } };

        expect(await fn(state, testSlugs)).to.eql([]);
      });

      it('doesn\'t do anything if there\'s a valid station slug that doesn\'t have a published station front', async function () {
        const slug = slugList[1],
          state = { components: {
            'www.domain.com/_components/section-front/instances/a': {
              stationSiteSlug: slug
            }
          } };

        expect(await fn(state, testSlugs)).to.eql([]);
      });

      it('returns error if it\'s not a valid station slug', async function () {
        const slug = 'notAValidSlug',
          state = { components: {
            'www.domain.com/_components/section-front/instances/a': {
              stationSiteSlug: slug
            }
          } };

        expect(await fn(state, testSlugs)).to.eql([{
          field: 'stationSiteSlug',
          location: 'Section Front » Site Slug',
          preview: `${slug} is not a valid station slug`,
          uri: 'www.domain.com/_components/section-front/instances/a'
        }]);
      });

      it('returns error if it\'s a station that already has a published station front', async function () {
        const slug = slugList[0],
          state = { components: {
            'www.domain.com/_components/section-front/instances/a': {
              stationSiteSlug: slug
            }
          } };

        expect(await fn(state, testSlugs)).to.eql([{
          field: 'stationSiteSlug',
          location: 'Section Front » Site Slug',
          preview: `A station page is already published for ${slug}`,
          uri: 'www.domain.com/_components/section-front/instances/a'
        }]);
      });
    });
  });
});
