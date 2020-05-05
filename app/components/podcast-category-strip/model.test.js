'use strict';

const { expect } = require('chai'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  _uniq = require('lodash/uniq');

describe(dirname, () => {
  describe(filename, () => {
    const { render } = require('./model');

    describe('render', () => {
      const ref = '_components/podcast-category-strip/instances/1',
        data = {
          category: {
            id: 31,
            name: 'Sports',
            slug: 'sports'
          },
          curatedPodcasts: [{
            podcast: {
              id: 8,
              label: 'The Morning Show w/ John and Hugh',
              title: 'The Morning Show w/ John and Hugh',
              url: '/podcasts/the-morning-show-w-john-and-hugh-8',
              imageUrl: 'https://images.radio.com/podcast/2D59B9B175C0F4AA0A5116D4A58C4245.jpg?size=small&',
              description: 'The Morning Show w/ John and Hugh'
            }
          }]
        },
        locals = {};

      it('should have 7 podcasts total in set', async () => {
        const result = await render(ref, data, locals);

        expect(result._computed.podcasts.length).to.eql(7);
      });
      it('adds curated to front of podcast set', async () => {
        const result = await render(ref, data, locals);

        expect(result._computed.podcasts[0]).to.eql(data.curatedPodcasts[0].podcast);
      });
      it('should contain no duplicates in podcast set', async () => {
        const result = await render(ref, data, locals);

        expect(_uniq(result._computed.podcasts).length === result._computed.podcasts.length).to.be.true;
      });
      it('sets see all link if category slug exists', async () => {
        const result = await render(ref, data, locals);

        expect(result._computed.seeAllLink).to.eql('/podcasts/collection/sports');
      });
    });
  });
});
