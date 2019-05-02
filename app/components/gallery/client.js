'use strict';

require('intersection-observer');

class Gallery {
  constructor() {
    this.sidebar = document.querySelector('.content__sidebar');
    this.galleryBody = document.querySelector('.gallery__body');
    this.firstInlineAd = document.querySelector('.slides__ad-container'),
    this.virtualPageviewObserver = new IntersectionObserver(this.virtualPageview.bind(this), {
      root: null,
      rootMargin: '0px',
      threshold: 1.0
    }),
    this.galleryAdTotal = document.querySelectorAll('.slides__ad-container').length,
    this.trackedPageviews = [];

    this.repositionRightRail();
    this.logoSponsorship = document.querySelector('.google-ad-manager--content-page-logo-sponsorship');
    setTimeout(() => {
      if (this.logoSponsorship.clientHeight === 0) {
        this.repositionRightRail();
      }
    }, 3000);

    if (this.firstInlineAd) {
      window.addEventListener('scroll', () => {
        this.hideTertiaryStickyAd();
      });
    }

    document.addEventListener('gallery-dismount', function () {
      // code to run when vue dismounts/destroys, aka just before a new "pageview" will be loaded.
      window.removeEventListener('scroll', () => {
        this.hideTertiaryStickyAd();
      });
    }.bind(this));

    // Add observers to inline ads
    document.querySelectorAll('.gallery__body .slides__ad-container .google-ad-manager__slot').forEach(inlineAd => {
      this.virtualPageviewObserver.observe(inlineAd);
    });
  }

  /**
   * Repositions the right rail under the gallery headline &
   * subheadline so that it is in line with the gallery body.
   * @function
   * @param {object} sidebar
   * @param {object} galleryBody
   */
  repositionRightRail() {
    this.sidebar.style.marginTop = this.galleryBody.offsetTop + 'px';
    this.sidebar.style.position = 'relative';
    this.sidebar.style.visibility = 'visible';
  }

  /**
   * Hide tertiary sticky ad after user scrolls past the first inline ad
   * so that it does not show up behind the inline right rail ads.
   * @function
   */
  hideTertiaryStickyAd() {
    const firstStickyAd = document.querySelector('.content__sidebar .sticky');

    if (firstStickyAd.offsetTop + firstStickyAd.offsetHeight > this.firstInlineAd.offsetTop) {
      if (firstStickyAd.style.visibility !== 'hidden') {
        firstStickyAd.style.visibility = 'hidden';
      }
    } else {
      if (firstStickyAd.style.visibility !== 'visible') {
        firstStickyAd.style.visibility = 'visible';
      }
    }
  }

  /**
   * Handle pageviews when scrolling to an ad in a gallery
   *
   * @param {array} changes
   */
  virtualPageview(changes) {
    changes.forEach(change => {
      const [galleryAdPosition] = /([\d]+)$/.exec(change.target.getAttribute('id'));

      // Trigger a virtual page view once the ad is fully in view and hasn't already been tracked
      if (change.intersectionRatio === 1 && this.trackedPageviews.indexOf(galleryAdPosition) === -1) {
        // Setup data layer data
        const dataLayerEvent = {
          event: 'virtualPageview',
          galleryAdPosition: galleryAdPosition,
          galleryAdTotal: this.galleryAdTotal
        };

        // Init Data Layer.
        window.dataLayer = window.dataLayer || [];

        // Push event onto Data Layer.
        window.dataLayer.push(dataLayerEvent);

        // Append pageview to array to remove double tracking
        this.trackedPageviews.push(galleryAdPosition);
      }
    });
  }
}

module.exports = () => new Gallery();
