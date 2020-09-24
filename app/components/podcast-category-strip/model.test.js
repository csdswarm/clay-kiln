/* eslint-disable max-nested-callbacks */
'use strict';

const chai = require('chai'),
  { assert, expect } = chai,
  sinon = require('sinon'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  _uniq = require('lodash/uniq');

chai.use(require('chai-sorted'));

describe(dirname, () => {
  describe(filename, () => {
    const { render, _internals } = require('./model');

    describe('render', () => {
      let sandbox;
      const ref = '_components/podcast-category-strip/instances/1',
        data = {
          category: {
            id: 31,
            name: 'Sports',
            slug: 'sports'
          },
          curatedPodcasts: []
        },
        locals = {},
        backfillPodcats = [
          {
            id: 170,
            attributes: {
              image: 'https://www.omnycontent.com/d/programs/4b5f9d6d-9214-48cb-8455-a73200038129/45115186-854b-4949-ace0-a78e007539c6/image.jpg?t=1580402304&size=Small',
              title: 'Jim Rome\'s Daily Jungle',
              site_slug: 'jim-romes-daily-jungle-170'
            }
          },
          {
            id: 31869,
            attributes: {
              image: 'https://images.radio.com/podcast/4DD3DEDF6F31442EDD80113E11912742.jpg',
              title: 'The Knight Cap',
              site_slug: 'the-knight-cap-31869'
            }
          },
          {
            id: 706,
            attributes: {
              image: 'https://images.radio.com/podcast/AC67246565E8FCBC45FEFEA6664A4CCB.jpg',
              title: 'The Taz Show',
              site_slug: 'the-taz-show-706'
            }
          },
          {
            id: 63,
            attributes: {
              image: 'https://images.radio.com/podcast/1D7ABBDFFF02123F6EFF9262210D0801.jpg',
              title: 'McNeil & Parkins Show',
              site_slug: 'mcneil-parkins-show-63'
            }
          },
          {
            id: 20622,
            attributes: {
              image: 'https://www.omnycontent.com/d/programs/4b5f9d6d-9214-48cb-8455-a73200038129/0c34076d-1248-4821-958e-a78e00b542d6/image.jpg"',
              title: 'Mike\'s On with Francesa',
              site_slug: 'mikes-on-with-francesa-20622'
            }
          },
          {
            id: 168,
            attributes: {
              image: 'https://www.omnycontent.com/d/programs/4b5f9d6d-9214-48cb-8455-a73200038129/845fe0e1-1e36-4342-9a35-a78e0074da12/image.jpg?t=1580402287&size=Small',
              title: 'Ferrall on the Bench',
              site_slug: 'ferrall-on-the-bench-168'
            }
          }, {
            id: 831,
            attributes: {
              image: 'https://images.radio.com/podcast/1792AAC3E12EE16CD95D1A8D7C5B4896.jpg',
              title: 'Boomer & Gio"',
              site_slug: 'boomer-gio-831'
            }
          }
        ];

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(_internals, 'getBackfillPodcasts');
        _internals.getBackfillPodcasts.resolves(backfillPodcats);
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('should have 7 podcasts total in set', () => {
        return render(ref, data, locals).then(result => {
          expect(result._computed.podcasts).to.have.lengthOf(7);
          assert(_internals.getBackfillPodcasts.calledOnce, 'getBackfillPodcasts should have been called once');
        });
      });

      it('adds curated to front of podcast set', () => {
        data.curatedPodcasts = [{
          podcast: {
            id: 8,
            label: 'The Morning Show w/ John and Hugh',
            title: 'The Morning Show w/ John and Hugh',
            url: '/podcasts/the-morning-show-w-john-and-hugh-8',
            imageUrl: 'https://images.radio.com/podcast/2D59B9B175C0F4AA0A5116D4A58C4245.jpg?size=small&',
            description: 'The Morning Show w/ John and Hugh'
          }
        }];

        return render(ref, data, locals).then(result => {
          expect(result._computed.podcasts[0]).to.eql(data.curatedPodcasts[0].podcast);
        });
      });

      it('should contain no duplicates in podcast set', () => {
        data.curatedPodcasts = [
          {
            podcast: {
              id: 8,
              label: 'The Morning Show w/ John and Hugh',
              title: 'The Morning Show w/ John and Hugh',
              url: '/podcasts/the-morning-show-w-john-and-hugh-8',
              imageUrl: 'https://images.radio.com/podcast/2D59B9B175C0F4AA0A5116D4A58C4245.jpg?size=small&',
              description: 'The Morning Show w/ John and Hugh'
            }
          },
          {
            podcast: {
              id: 170,
              label: 'Jim Rome\'s Daily Jungle',
              title: 'Jim Rome\'s Daily Jungle',
              url: '/podcasts/jim-romes-daily-jungle-170',
              imageUrl: 'https://www.omnycontent.com/d/programs/4b5f9d6d-9214-48cb-8455-a73200038129/45115186-854b-4949-ace0-a78e007539c6/image.jpg?size=small&t=1580402304&',
              description: 'A daily round-up of the best of The Jim Rome Show'
            }
          }
        ];

        return render(ref, data, locals).then(result => {
          expect(_uniq(result._computed.podcasts).length === result._computed.podcasts.length).to.be.true;
        });
      });

      it('sets see all link if category slug exists', () => {
        return render(ref, data, locals).then(result => {
          expect(result._computed.seeAllLink).to.eql('/podcasts/collection/category/sports');
        });
      });
    });
  });
});
