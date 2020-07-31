'use strict';

const
  podcast = require('./podcast'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  { expect } = chai;

chai.use(sinonChai);

describe('server', () => {
  afterEach(sinon.restore);

  describe('podcast', () => {
    function setupPodcast() {
      const { _internals: __, getPodcastEpisode, getPodcastShow } = podcast,
        DEFAULT_RESULT_SHOW = {
          meta: {
            count: 1
          },
          data: [
            {
              type: "podcast",
              id: 16,
              attributes: {
                description: "Jerry Coleman",
                explicit: null,
                image: "https://images.radio.com/podcast/466AF0C60FC3CC689050E32913ADBB20.jpg",
                keyword: null,
                popularity: 3,
                rss_feed: "https://www.omnycontent.com/d/playlist/4b5f9d6d-9214-48cb-8455-a73200038129/51590cea-b0d5-4b0c-a7e5-a78e00164d53/c25707f6-7d06-4f1c-ae5d-a78e00164d58/podcast.rss",
                title: "Sports With Coleman",
                vanity_url: null,
                site_slug: "sports-with-coleman-16",
                partner: {
                  id: 1,
                  name: "Entercom"
                },
                stream_provider: {
                  id: null,
                  name: null
                },
                category: [
                  {
                    id: 31,
                    name: "Sports",
                    slug: "sports"
                  }
                ],
                show: [
                  {
                    id: 2579,
                    name: "Sports with Coleman"
                  }
                ],
                station: []
              },
              links: {
                self: "http://api.radio.com/v1/podcasts/16"
              }
            }
          ],
          links: {
            self: "http://api.radio.com/v1/podcasts?filter[site_slug]=sports-with-coleman-16",
            last: "http://api.radio.com/v1/podcasts?filter%5Bsite_slug%5D=sports-with-coleman-16&page%5Bnumber%5D=1",
            first: "http://api.radio.com/v1/podcasts?filter%5Bsite_slug%5D=sports-with-coleman-16&page%5Bnumber%5D=1"
          }
        },
        DEFAULT_RESULT_EPISODE = {
          meta: {
            count: 1
          },
          data: [
            {
              type: "episode",
              id: 130013,
              attributes: {
                title: "US Open '92 Winner Tom Kite Joins Jerry Coleman",
                description: "US Open '92 Winner Tom Kite Joins Jerry Coleman ",
                explicit: null,
                keyword: null,
                image_url: "https://www.omnycontent.com/d/clips/4b5f9d6d-9214-48cb-8455-a73200038129/51590cea-b0d5-4b0c-a7e5-a78e00164d53/ea549d23-548f-4cda-a67f-a7b3002b38c9/image.jpg?size=Medium",
                audio_url: "https://traffic.omny.fm/d/clips/4b5f9d6d-9214-48cb-8455-a73200038129/51590cea-b0d5-4b0c-a7e5-a78e00164d53/ea549d23-548f-4cda-a67f-a7b3002b38c9/audio.mp3",
                video_url: null,
                embed_url: "https://omny.fm/shows/sports-with-coleman/us-open-92-winner-tom-kite-joins-jerry-coleman/embed",
                duration_seconds: "787.513",
                publish_state: "Published",
                published_url: "https://omny.fm/shows/sports-with-coleman/us-open-92-winner-tom-kite-joins-jerry-coleman",
                published_date: "2017-07-11T13:50:14.000Z",
                program_id: "51590cea-b0d5-4b0c-a7e5-a78e00164d53",
                site_slug: "us-open-92-winner-tom-kite-joins-jerry-coleman-130013",
                podcast: [
                  {
                    id: 16,
                    title: "Sports With Coleman",
                    description: "Jerry Coleman",
                    site_slug: "sports-with-coleman-16",
                    categories: [
                      {
                        id: 31,
                        name: "Sports"
                      }
                    ]
                  }
                ]
              },
              links: {
                self: "http://api.radio.com/v1/episodes/130013"
              }
            }
          ],
          links: {
            self: "http://api.radio.com/v1/episodes?filter[episode_site_slug]=us-open-92-winner-tom-kite-joins-jerry-coleman-130013",
            last: "http://api.radio.com/v1/episodes?filter%5Bepisode_site_slug%5D=us-open-92-winner-tom-kite-joins-jerry-coleman-130013&page%5Bnumber%5D=1",
            first: "http://api.radio.com/v1/episodes?filter%5Bepisode_site_slug%5D=us-open-92-winner-tom-kite-joins-jerry-coleman-130013&page%5Bnumber%5D=1"
          }
        };
    
      return {
        __,
        DEFAULT_RESULT_EPISODE,
        DEFAULT_RESULT_SHOW,
        getPodcastEpisode,
        getPodcastShow
      };
    }
    
    describe('getPodcastShow', () => {
      async function setup_podcastShow(options = {}) {
        const { __, DEFAULT_RESULT_SHOW, getPodcastShow } = setupPodcast(),
          result = options.result || DEFAULT_RESULT_SHOW,
          getStub = sinon.stub(),
          isEmptyStub = sinon.stub();

        getStub.resolves(result);
        isEmptyStub.resolves(true);
        __.radioApiService.get = getStub;
        __.isEmpty = isEmptyStub;
        
        const response = await getPodcastShow({}, 'podcast-show-slug');

        return {
          getStub,
          isEmptyStub,
          response
        };
      }

      it('finds results from podcast show service', async () => {
        const { response } = await setup_podcastShow();

        expect(response).to.be.an('object');
        expect(response).to.have.property('id')
          .that.eqls(16);
        expect(response).to.have.property('type')
          .that.eqls('podcast');
      });

      it('not found slug in podcast show service', async () => {
        const options = {
            result: {
              data: []
            }
          },
          { getStub, response } = await setup_podcastShow(options);

        expect(response).to.eql({});
        expect(getStub).to.have.been.callCount(1);
      });
    });

    describe('getPodcastEpisode', () => {
      async function setup_podcastEpisode(options = {}) {
        const { __, DEFAULT_RESULT_EPISODE, getPodcastEpisode } = setupPodcast(),
          result = options.result || DEFAULT_RESULT_EPISODE,
          getStub = sinon.stub(),
          isEmptyStub = sinon.stub();

        getStub.resolves(result);
        isEmptyStub.resolves(true);
        __.radioApiService.get = getStub;
        __.isEmpty = isEmptyStub;
        
        const response = await getPodcastEpisode({}, 'podcast-episode-slug');

        return {
          getStub,
          isEmptyStub,
          response
        };
      }

      it('finds results from podcast episode service', async () => {
        const { response } = await setup_podcastEpisode();

        expect(response).to.be.an('object');
        expect(response).to.have.property('id')
          .that.eqls(130013);
        expect(response).to.have.property('type')
          .that.eqls('episode');
      });

      it('not found slug in podcast episode service', async () => {
        const options = {
            result: {
              data: []
            }
          },
          { getStub, response } = await setup_podcastEpisode(options);

        expect(response).to.eql({});
        expect(getStub).to.have.been.callCount(1);
      });
    });
  });
});
