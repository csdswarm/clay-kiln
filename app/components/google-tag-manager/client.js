'use strict';

const isEmpty = require('lodash/isEmpty');

/**
 * Add Google Tag Manager script and setup dataLayer array on first page load
 * @function
 */
(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const firstScript = document.getElementsByTagName('script')[0],
    newScript = document.createElement('script'),
    googleContainerId = document.getElementById('google-tag-manager').getAttribute('data-container-id');

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  newScript.async = true;
  newScript.src = `https://www.googletagmanager.com/gtm.js?id=GTM-${googleContainerId}`;
  firstScript.parentNode.insertBefore(newScript, firstScript);
})();

/**
 *
 * Update dataLayer on SPA navigation (ie send new data to GTM on new SPA "pageview").
 *
 */
document.addEventListener('pageView', function (event) {

  // Init Data Layer.
  window.dataLayer = window.dataLayer || [];

  // Build Data Layer event for new SPA pageview.
  const dataLayerEvent = {
    event: 'Pageview',
    contentType: getContentType(event.detail),
    title: event.detail.toTitle,
    'og:title': event.detail.toTitle,
    description: event.detail.toDescription,
    'twitter:image': event.detail.toMetaImageUrl,
    'og:image': event.detail.toMetaImageUrl,
    url: `${window.location.protocol}//${window.location.hostname}${event.detail.toPath}`
  };

  // Push event onto Data Layer.
  window.dataLayer.push(dataLayerEvent);
  
});

function getContentType(eventPayload) {
  let contentType = null;

  if (!isEmpty(eventPayload.toArticlePage)) {
    contentType = 'article';
  } else if (!isEmpty(eventPayload.toGalleryPage)) {
    contentType = 'gallery';
  } else if (!isEmpty(eventPayload.toHomepage)) {
    contentType = 'homepage';
  } else if (!isEmpty(eventPayload.toSectionFrontPage)) {
    contentType = 'sectionfront';
  } else if (!isEmpty(eventPayload.toTopicPage)) {
    contentType = 'topic';
  } else if (!isEmpty(eventPayload.toStationDetailPage)) {
    contentType = 'stationdetail';
  } else {
    contentType = 'page';
  }
  
  return contentType;
}
