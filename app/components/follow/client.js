/* jshint strict: true, browser: true */
/* global DS */
'use strict';

const $popup = require('../../services/client/popup');

DS.controller('follow', ['_', function (_) {

  function Constructor(el) {
    this.el = el;
  }

  Constructor.prototype = {
    events: {
      click: 'openFollow'
    },

    /**
     * opens new browser window to corresponding
     * social network follow page
     * @param {Event} e
     */
    openFollow: function (e) {
      var Position = $popup.position,
        Params = $popup.params,
        opts = {},
        dims = { w: 780, h: 500 },
        features = Position(dims.w, dims.h),
        classList = this.el.classList,
        args,
        socialHandler,
        socialNetworks = [
          {
            className: 'facebook',
            url: 'https://facebook.com/{handle}',
            network: 'Facebook'
          },
          {
            className: 'pinterest',
            url: 'http://www.pinterest.com/{handle}',
            network: 'Pinterest'
          },
          {
            className: 'instagram',
            url: 'https://www.instagram.com/{handle}',
            network: 'Instagram'
          },
          {
            className: 'rss',
            url: 'http://feeds.feedburner.com/{handle}',
            network: 'RSS'
          },
          {
            className: 'twitter',
            url: 'https://twitter.com/intent/follow?screen_name={handle}&tw_p=followbutton&variant=2.0',
            network: 'Twitter'
          }
        ];

      if (e.target.hasAttribute('data-handle')) {
        opts.handle = e.target.getAttribute('data-handle');
      } else {
        opts.handle = e.target.parentNode.getAttribute('data-handle');
      }

      dims.left = features.left;
      dims.top = features.top;

      socialHandler = _.find(socialNetworks, function (socialNetwork) {
        return classList.contains(socialNetwork.className);
      });

      opts.url = socialHandler.url.replace('{handle}', opts.handle);
      opts.network = socialHandler.network;

      opts.name = 'Follow ' + opts.handle + ' on ' + opts.network;
      args = Params(opts, dims);
      window.open(args.address, args.name, args.features);
      e.preventDefault();
    }
  };

  return Constructor;
}]);
