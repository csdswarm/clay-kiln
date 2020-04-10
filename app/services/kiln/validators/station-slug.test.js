'use strict';
// Stub out window, and locals
const slugList = [ 'someValidSlug', 'anotherValidSlug' ],
  toStationsObject = (obj, slug) => {
    obj[slug] = { slug };
    return obj;
  };

global.window = {
  kiln: {
    locals: {
      stationsIHaveAccessTo: slugList.reduce(toStationsObject, {}),
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
  lib = require('./station-slug'),
  db = require('../../client/db'),
  sinon = require('sinon');

describe(dirname, function () {
  describe(filename, function () {
    describe('validate', async function () {
      const fn = lib[this.title];
      let sandbox = sinon.createSandbox();

      beforeEach(function () {
        sandbox = sinon.createSandbox();

        // Stub db.get to make it look like slugList[0] has a published station front
        sandbox.stub(db, 'get').returns([ { name: slugList[0], value: slugList[0] } ]);
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('doesn\'t do anything if there\'s no section-front component', async function () {
        const state = { components: {
          'www.domain.com/_components/some-other-component/instances/a': {}
        } };

        expect(await fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if there\'s no stationSiteSlug field', async function () {
        const state = { components: {
          'www.domain.com/_components/section-front/instances/a': {}
        } };

        expect(await fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if there\'s a valid station slug that doesn\'t have a published station front', async function () {
        const slug = slugList[1],
          state = { components: {
            'www.domain.com/_components/section-front/instances/a': {
              stationSiteSlug: slug
            }
          } };

        expect(await fn(state)).to.eql([]);
      });

      it('returns error if it\'s not a valid station slug', async function () {
        const slug = 'notAValidSlug',
          state = { components: {
            'www.domain.com/_components/section-front/instances/a': {
              stationSiteSlug: slug
            }
          } };

        expect(await fn(state)).to.eql([{
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

        expect(await fn(state)).to.eql([{
          field: 'stationSiteSlug',
          location: 'Section Front » Site Slug',
          preview: `A station page is already published for ${slug}`,
          uri: 'www.domain.com/_components/section-front/instances/a'
        }]);
      });
    });
  });
});
