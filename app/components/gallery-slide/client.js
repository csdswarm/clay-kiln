'use strict';

/**
 *
 * Update dataLayer on gallerySlidePageview event to register Slide
 * Google Analytics pageview.
 *
 */
document.addEventListener('gallerySlidePageView', function (event) {

  // Init Data Layer.
  window.dataLayer = window.dataLayer || [];

  // Build Data Layer event for new Slide pageview.
  const dataLayerEvent = {
    event: 'Gallery Slide Pageview',
    title: event.detail.slideTitle,
    url: `${window.location.protocol}//${window.location.hostname}${event.detail.slideSlug}`
  };

  // Push event onto Data Layer.
  window.dataLayer.push(dataLayerEvent);
  
});
