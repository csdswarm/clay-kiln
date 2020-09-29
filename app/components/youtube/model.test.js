'use strict';

const chai = require('chai'),
  { expect } = chai,
  youtube = require('./model'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('youtube model', function () {

  afterEach(sinon.restore);

  function setup_model() {
    const { _internals: __, save } = youtube,
      mockLocals = { site: { slug: 'www.radio.com' } },
      videoDetails = {
        _version: 2,
        autoPlay: false,
        contentId: 'guRSl3n5nOc',
        videoType: 'Related',
        isPlaylist: false,
        origSource: 'https://www.youtube.com/watch?v=guRSl3n5nOc',
        videoTitle:
          'Andrea Bocelli - Time To Say Goodbye - Live From Piazza Dei Cavalieri, Italy / 1997',
        videoValid: true,
        channelName: 'AndreaBocelliVEVO',
        videoSource: 'video',
        playerCaption:
          'Values changed to Editorials tiny bit to sponsered for sure',
        videoDuration: 399,
        videoLocation: 'article',
        videoPlaylist: '',
        playerHeadline: 'Updated with related stuff making changes',
        videoThumbnail: 'https://i.ytimg.com/vi/guRSl3n5nOc/maxresdefault.jpg',
        playerBorderTop: true,
        autoPlayNextVideo: false,
        componentVariation: 'youtube',
        playerBorderBottom: true,
        playerBorderTopCTA: 'Watch',
        previousTypeRelated: true },
      videoDetailsUpdate = {
        _version: 2,
        autoPlay: false,
        contentId: 'anotherVideoId',
        videoType: 'othervideo type',
        isPlaylist: false,
        origSource: 'https://www.youtube.com/watch?v=guRSl3n5nOc',
        videoTitle:
          'Andrea Bocelli - Time To Say Goodbye - Live From Piazza Dei Cavalieri, Italy / 1997',
        videoValid: true,
        channelName: 'AndreaBocelliVEVO',
        videoSource: 'video',
        playerCaption:
          'Values changed to Editorials tiny bit to sponsered for sure',
        videoDuration: 399,
        videoLocation: 'article',
        videoPlaylist: '',
        playerHeadline: 'Updated with related stuff making changes with update',
        videoThumbnail: 'https://i.ytimg.com/vi/guRSl3n5nOc/maxresdefault.jpg',
        playerBorderTop: true,
        autoPlayNextVideo: false,
        componentVariation: 'youtube',
        playerBorderBottom: true,
        playerBorderTopCTA: 'Watch',
        previousTypeRelated: true };
      
    return { __, mockLocals, save, videoDetails, videoDetailsUpdate };
  };
  describe('save', () => {
    function setup_save() {
      const { __, mockLocals, save, videoDetails, videoDetailsUpdate } = setup_model();

      sinon.stub(__, 'dbGet').resolves(videoDetails);
      sinon.stub(__, 'getVideoDetails').resolves(videoDetails);
      sinon.spy(__, 'clearContentId');
      sinon.stub(__, 'updateSettingsByType');
      sinon.spy(__, 'setVideoDetails');
      return { __, mockLocals, save, videoDetails, videoDetailsUpdate };
    };

    
    it('shows the video id without extra parameters in the query string', async () => {
      const { __, mockLocals, save, videoDetails } = setup_save(),
        data = await save('some_ref', videoDetails, mockLocals);

      expect(__.clearContentId).to.have.been.calledOnce;
      expect(__.updateSettingsByType).to.have.been.calledOnce;
      expect(data.contentId).to.eql('guRSl3n5nOc');
    });

    it('updates the video settings by type of video', async () => {
      const { __, mockLocals, save, videoDetails } = setup_save(),
        data = await save('some_ref', videoDetails, mockLocals);

      expect(__.updateSettingsByType).to.have.been.calledOnce;
      expect(__.updateSettingsByType).to.have.been.calledAfter(__.clearContentId);
      expect(data.playerBorderTopCTA).to.eql('Watch');
    });

    it('sets autoPlay and autoPlayNextVideo to false if videoType is Sponsored and previousTypeRelated is true', async () => {
      const { mockLocals, save, videoDetails } = setup_save(),
        data = await  save('some_ref', videoDetails, mockLocals);

      expect(data.autoPlay).to.be.false;
      expect(data.autoPlayNextVideo).to.be.false;
    });

    it('does not call getVideoDetails when contentId does not change', async () => {
      const { __, mockLocals, save, videoDetailsUpdate } = setup_save(),
        data = await  save('some_ref', videoDetailsUpdate, mockLocals);

      expect(__.getVideoDetails).to.have.been.calledOnce;
      expect(data.contentId).to.eql('anotherVideoId');
    });

    it('calls getVideoDetails when contentId does change', async () => {
      const { __, mockLocals, save, videoDetails } = setup_save(),
        data = await  save('some_ref', videoDetails, mockLocals);

      expect(__.getVideoDetails).to.not.have.been.called;
      expect(data.contentId).to.be.eql('guRSl3n5nOc');
    });
  });
});
