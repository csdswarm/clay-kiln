'use strict';

const dom = require('@nymag/dom');

DS.controller('image-gallery-image', ['lazyLoad', '$gtm', '$visibility', function (lazyLoad, $gtm, $visibility) {
  function Constructor(el) {
    var gridWrapper = dom.find(el, '.grid-img'),
      gridImg = dom.find(gridWrapper, 'img'),
      gridSources = dom.findAll(gridWrapper, 'source'),
      listWrapper = dom.find(el, '.list-img'),
      listImg = dom.find(listWrapper, 'img'),
      listSources = dom.findAll(listWrapper, 'source'),
      listLazy = new lazyLoad.LazyLoader(listWrapper, listImg, listSources),
      gridLazy = new lazyLoad.LazyLoader(gridWrapper, gridImg, gridSources),
      listVisible = new $visibility.Visible(listWrapper),
      gridVisible = new $visibility.Visible(gridWrapper),
      imageGalleryId = dom.find('.image-gallery').getAttribute('data-uri'),
      index = el.id.replace('image-gallery-image-', '');

    this.attribution = dom.find(el, '.attribution');

    listLazy.init();
    gridLazy.init();

    function reportImpression(view) {
      $gtm.reportSoon({
        event: 'imageGalleryView',
        imageGalleryId: imageGalleryId,
        imageGalleryIndex: index,
        imageGalleryVariant: view
      });
    }

    listVisible.on('shown', function () {
      reportImpression('list');

      listVisible.destroy();
    });

    gridVisible.on('shown', function () {
      reportImpression('grid');

      gridVisible.destroy();
    });
  }

  Constructor.prototype = {
    events: {
      '.attribution click': 'expandAttribution'
    },
    expandAttribution: function () {
      if (dom.find(this.attribution, '.shortened')) {
        this.attribution.classList.toggle('truncated');
      }
    }
  };

  return Constructor;
}]);

