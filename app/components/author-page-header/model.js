'use strict';

module.exports.render = (ref, data, locals) => {
  const {email, facebookHandle, instagramHandle, twitterHandle, youtubeHandle} = data;

  if (locals && locals.params && locals.params.dynamicAuthor) {
    data.author = locals.params.dynamicAuthor.replace(/-/g, ' ').replace(/\//g,'');
  }

  if (email || facebookHandle || instagramHandle || twitterHandle || youtubeHandle) {
    data.showSocial = true;

    data.facebookUrl = facebookHandle && `https://www.facebook.com/${facebookHandle}`;
    data.instagramUrl = instagramHandle && `https://www.instagram.com/${instagramHandle}`;
    data.twitterUrl = twitterHandle && `https://www.twitter.com/${twitterHandle}`;
    data.youtubeUrl = youtubeHandle && `https://www.youtube.com/${youtubeHandle}`;
  }

  return data;
};
