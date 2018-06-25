'use strict';

const sanitize = require('../../services/universal/sanitize');

// gets the embed type (album, artist, playlist, or track) and the Spotify URI Code from the url pasted in
function getEmbedDetails(data) {
  const embedUrl = data.url,
    // playlists have a different URL format than albums, tracks, and artist embeds
    // if isAlbumOrArtistOrTrack is not null, it parses out the type of embed (album, artist or track)
    isAlbumOrArtistOrTrack = embedUrl.match(/open\.spotify\.com\/(album|track|artist)\//i),
    // grabs the album, artist or track's Spotify URI from the url pasted in
    spotifyUriCode = embedUrl.match(/(album|artist|track|playlist)\/(.*)/i),
    // parses out playlist creator since Spotify playlist links include the creator of the playlist
    // e.g., open.spotify.com/user/spotify/playlist/... or open.spotify.com/user/hamiltonmusical/playlist/...
    playlistCreator = embedUrl.match(/\/user\/(.*)\/playlist/i);

  if (isAlbumOrArtistOrTrack) {
    data.embedType = isAlbumOrArtistOrTrack[1];
  } else {
    data.embedType = 'playlist';
    data.playlistCreator = playlistCreator[1];
  }
  data.spotifyUriCode = spotifyUriCode[2];
}

module.exports.render = (ref, data) => { // TODO: convert to module.exports.save
  if (data.url) {
    // remove any HTML tags that may have been carried over when pasting from google docs
    data.url = sanitize.toPlainText(data.url);
    getEmbedDetails(data);
  }
  return data;
};
