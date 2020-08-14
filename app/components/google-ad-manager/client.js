'use strict';


const _get = require('lodash/get'),
  _debounce = require('lodash/debounce'),
  adMapping = require('./adMapping'),
  googleAdManagerComponent = document.querySelector('.component--google-ad-manager'),
  getPageData = require('../../services/universal/analytics/get-page-data'),
  getTrackingData = require('../../services/universal/analytics/get-tracking-data'),
  makeFromPathname = require('../../services/universal/analytics/make-from-pathname'),
  {
    pageTypeTagArticle,
    pageTypeTagSection,
    pageTypeTagStationDetail,
    pageTypeTagStationsDirectory,
    NMC,
    OG_TYPE
  } = require('../../services/universal/analytics/shared-tracking-vars'),
  adSizes = adMapping.adSizes,
  doubleclickPrefix = '21674100491',
  rightRailAdSizes = ['medium-rectangle', 'half-page', 'half-page-topic'],
  adRefreshInterval = googleAdManagerComponent ? googleAdManagerComponent.getAttribute('data-ad-refresh-interval') : 120000, // Time in ms for ad refresh
  apsPubId = googleAdManagerComponent ? googleAdManagerComponent.getAttribute('data-aps-pub-id') : null,
  apsLoadTimeout = parseInt(googleAdManagerComponent ? googleAdManagerComponent.getAttribute('data-aps-load-timeout') : 120000, 10),
  apsBidTimeout = parseInt(googleAdManagerComponent ? googleAdManagerComponent.getAttribute('data-aps-bid-timeout') : 120000, 10),
  sharethroughPlacementKey = googleAdManagerComponent ? googleAdManagerComponent.getAttribute('data-sharethrough-placement-key') : null,
  urlParse = require('url-parse'),
  lazyLoadObserverConfig = {
    root: null,
    rootMargin: '0px',
    threshold: 0
  },
  observer = new IntersectionObserver(lazyLoadAd, lazyLoadObserverConfig),
  amazonTam = require('./aps')(apsPubId, apsLoadTimeout, apsBidTimeout),
  disabledRefreshAds = new Set();
let refreshCount = 0,
  allAdSlots = {},
  adsRefreshing = false,
  initialPageAdSlots = [],
  clearDfpTakeover = () => {},
  numRightRail = 1,
  numGalleryInline = 1,
  numStationsDirectoryInline = 1,
  adIndices = {},
  adsMounted = false,
  prevLocation = window.location.href,
  windowWidth = '';

// On page load set up sizeMappings
adMapping.setupSizeMapping();

/**
 * Add Sharethrough on first page load
 * @function
 */
(() => {
  const firstScript = document.getElementsByTagName('script')[0],
    newScript = document.createElement('script');

  newScript.async = true;
  newScript.src = 'https://native.sharethrough.com/assets/sfp.js';
  firstScript.parentNode.insertBefore(newScript, firstScript);
})();

// Listener to ensure lytics has been setup in GTM (Google Tag Manager)
document.addEventListener('gtm-lytics-setup', () => {
  initializeAds();
}, false);

document.addEventListener('content-feed-lazy-load', () => {
  googletag.destroySlots();
  adsMounted = true;
  initializeAds();
}, false);

// Set up ads when navigating in SPA
document.addEventListener('google-ad-manager-mount', () => {
  // This will allow initializeAds to trigger ad refresh
  adsMounted = true;
  windowWidth = window.innerWidth;
  window.addEventListener('resize', debounceRefresh());
});

// Reset data when navigating in SPA
document.addEventListener('google-ad-manager-dismount', () => {
  googletag.cmd.push(function () {
    googletag.destroySlots();
  });
  window.removeEventListener('resize', debounceRefresh());
});

// Refreshes ads when navigating to other pages in SPA
window.onload = function () {
  const
    bodyList = document.querySelector('body'),
    observer = new MutationObserver( mutations => {
      mutations.forEach( () => {
        if (prevLocation !== window.location.href) {
          prevLocation = window.location.href;
          refreshAllSlots();
        }
      });
    }),
    config = {
      childList: true,
      subtree: true
    };

  observer.observe(bodyList, config);
};

// Create listeners inside of the context of having googletag.pubads()
googletag.cmd.push(() => {
  // Handle right rail refresh via DFP event trigger
  googletag.pubads().addEventListener('impressionViewable', event => {
    // Trigger the fresh once the first ad registers an impression
    if (allAdSlots[event.slot.getSlotElementId()] && !adsRefreshing) {
      adsRefreshing = true;
      googletag.pubads().setTargeting('refresh', (refreshCount++).toString());
      setTimeout(function () {
        // Refresh ads
        const filteredAds = Object.entries(allAdSlots).filter(([id]) => {
            id = id.split('--')[1];

            return !disabledRefreshAds.has(id);
          }),
          adsToRefresh = filteredAds.map(([, slot]) => slot),
          adsToBid = filteredAds.reduce((refreshingAds, [id, slot]) => {
            refreshingAds[id] = slot;

            return refreshingAds;
          }, {});

        amazonTam.fetchAPSBids(adsToBid, () => {
          clearDfpTakeover();

          googletag.pubads().refresh(adsToRefresh, { changeCorrelator: false });

          // Remove the observers
          [...document.querySelectorAll('.google-ad-manager__slot')].forEach((adSlot) => {
            observer.unobserve(adSlot);
          });
          adsRefreshing = false;
        });
      }, adRefreshInterval);
    }
  });

  // Handle collapsing empty div manually as DFP collapseEmptyDiv doesn't work when lazy loading
  googletag.pubads().addEventListener('slotRenderEnded', event => {
    const id = event.slot.getSlotElementId(),
      adSlot = document.getElementById(id).parentElement,
      isOOP = adSlot.classList.contains('google-ad-manager__slot--outOfPage');

    if (isOOP) {
      updateSkinStyles(!(event.isEmpty)); // eslint-disable-line no-extra-parens
    }
    if (event.isEmpty) {
      adSlot.style.display = 'none';
    } else {
      // Unhide parent incase this was a refresh after an empty response
      adSlot.style.display = 'flex';

      if (adSlot.classList.contains('google-ad-manager--mobile-adhesion')) {
        addCloseEvent(adSlot);
      }
    }
  });
});

/**
 * Returns the content if the selector is successful, otherwise the optional
 *   fallback value.
 * @param {string} attrKey
 * @param {string} attrVal
 * @param {*} [fallback]
 * @returns {*}
 */
function getMetaTagContent(attrKey, attrVal, fallback) {
  return _get(
    document.querySelector(`meta[${attrKey}="${attrVal}"]`),
    'content',
    fallback
  );
}

/**
 * Set up all ads on the page
 */
function initializeAds() {
  if (adsMounted) {
    // Make sure all globals are reset
    resetAds();

    // Lytics will take care of initial set up but doesn't run after first page load
    // code to run when vue mounts/updates
    if (googletag.pubadsReady) { // Only do this if the service was created
      googletag.pubads().updateCorrelator(); // Force correlator update on new pages
    }

    setAdsIDs();
  } else {
    // Retry loading ads every 100ms until they've been mounted
    window.setTimeout(initializeAds, 100);
  }
}

/**
 * Reset all globals
 */
function resetAds() {
  clearDfpTakeover();
  // undo style changes to billboard

  // Reset slot arrays/objects
  allAdSlots = {};
  initialPageAdSlots = [];
  numRightRail = 1;
  numGalleryInline = 1;
  numStationsDirectoryInline = 1;
  refreshCount = 0;
  adIndices = {};
  adsMounted = false;
}

/**
 * Load ads when they come into view
 *
 * @param {array} changes
 * @param {IntersectionObserver} observer
 */
function lazyLoadAd(changes, observer) {
  changes.forEach(change => {
    if (change.intersectionRatio > 0) {
      // Stop watching and load the ad
      googletag.pubads().refresh([allAdSlots[change.target.id]], { changeCorrelator: false });
      observer.unobserve(change.target);
    }
  });
}
/**
 * Refreshes all slots when navigating between pages
 */
const  refreshAllSlots = () => {
  googletag.cmd.push(() => {
    googletag.pubads().refresh();
  });
};


/**
 * adds a listener to the x div to enable it to close the current ad
 *
 * @param {object} ad - a mobile adhesion ad object
 */
function addCloseEvent(ad) {
  ad.querySelector('.mobile-adhesion__close').addEventListener('click', (event) => {
    event.target.parentElement.style.display = 'none';
  }, true);
}

// add a close event to the X
document.querySelectorAll('.google-ad-manager--mobile-adhesion').forEach(ad => addCloseEvent(ad));


/**
 * Update the billboard ad on the page to have a transparent or opaque white background
 * Also change the bottom margin to -0.875em
 *
 * @param {boolean} hasSkin - Whether we want the top billboard to be transparent
 */
function updateSkinStyles(hasSkin) {
  const billboard = document.querySelector('.google-ad-manager--billboard');

  if (hasSkin) {
    billboard.style['background'] = 'transparent';
    billboard.style['margin-bottom'] = '0';
  } else {
    billboard.style['background'] = null;
    billboard.style['margin-bottom'] = null;
    document.body.style.backgroundColor = null;
  }
}

/**
 * Create and add unique ids to each ad slot on page
 *
 * @param {array} adSlots - Specific ad slots to refresh
 */
function setAdsIDs(adSlots = null) {
  const adSizeRegex = /google-ad-manager__slot--([^\s\"]+)/;

  adSlots = adSlots || document.getElementsByClassName('component--google-ad-manager');
  // Loop over all slots and give them unique indexed ID's
  [...adSlots].forEach((slot) => {
    const dfpContainer = slot.querySelector('.google-ad-manager__slot'),
      [, slotSize] = adSizeRegex.exec(dfpContainer.classList[1]);

    if (typeof adIndices[slotSize] === 'undefined') {
      adIndices[slotSize] = 1;
    } else {
      adIndices[slotSize]++;
    }
    dfpContainer.id = dfpContainer.classList[1].concat('-', adIndices[slotSize]);
  });

  createAds(adSlots);
}

function isArticleOrGallery(pageData) {
  return pageData.page === 'article'
    || pageData.page === 'vgallery';
}

/**
 * Returns an array of authors when on a gallery or article page, otherwise an
 *   empty array.
 *
 * @param {object} pageData - the result of 'services/universal/analytics/get-page-data.js'
 * @returns {string|undefined}
 */
function getAuthors(pageData) {
  if (!isArticleOrGallery(pageData)) {
    return [];
  }

  const articleOrGallery = pageData.page === 'article'
    ? 'article'
    : 'gallery';

  return Array.from(document.querySelectorAll(`.component--${articleOrGallery} .author`))
    .map(tag => {
      return tag.getAttribute('data-author')
        .replace(/\s/, '-')
        .toLowerCase();
    });
}

/**
 * Returns an array of ad tags when on a gallery or article page, otherwise an
 *   empty array.
 *
 * @param {object} pageData - the result of 'services/universal/analytics/get-page-data.js'
 * @returns {string[]}
 */
function getContentTags(pageData) {
  if (!isArticleOrGallery(pageData)) {
    return [];
  }

  const adTagsEl = document.querySelector('.component--ad-tags');

  return adTagsEl
    ? (adTagsEl.getAttribute('data-normalized-ad-tags') || '').split(',')
    : [];
}

/**
 * Gets the targeting data which is potentially shared with Nieslen Marketing
 *   Cloud meta tags (depending on whether they were imported from the
 *   drupal api).  When the nielsen marketing cloud meta tags are imported, we
 *   should ignore them and just get the tracking data from the dom.
 *
 * @param {boolean} shouldUseNmcTags
 * @param {object} currentStation - the station object
 * @param {object} pageData - the result of 'services/universal/analytics/get-page-data.js'
 * @returns {object}
 */
function getInitialAdTargetingData(shouldUseNmcTags, currentStation, pageData) {
  // we can't refer to the NMC tags for author since NMC only holds a single
  //   author for some reason.
  const authors = getAuthors(pageData),
    contentTags = getContentTags(pageData),
    trackingData = getTrackingData({
      pathname: window.location.pathname,
      station: currentStation,
      pageData,
      contentTags
    }),
    adTargetingData = {
      targetingAuthors: authors,
      // google ad manager doesn't take the tags from nmc since nmc cares about
      //   the editorial tags rather than the ad tags.
      targetingTags: trackingData.tag
    };

  if (shouldUseNmcTags) {
    const market = pageData.page === 'stationDetail'
      ? getMetaTagContent('name', NMC.market)
      : undefined;

    Object.assign(adTargetingData, {
      targetingCategory: getMetaTagContent('name', NMC.cat),
      targetingGenre: getMetaTagContent('name', NMC.genre),
      targetingMarket: market,
      targetingPageId: getMetaTagContent('name', NMC.pid),
      targetingRadioStation: getMetaTagContent('name', NMC.station)
    });
  } else {
    Object.assign(adTargetingData, {
      targetingCategory: trackingData.cat,
      targetingGenre: trackingData.genre,
      targetingMarket: trackingData.market,
      targetingPageId: trackingData.pid,
      targetingRadioStation: trackingData.station
    });
  }

  if (isArticleOrGallery(pageData)) {
    adTargetingData.targetingPageId = adTargetingData.targetingPageId.substring(0, 39);
  }

  return adTargetingData;
}

function getCurrentStation() {
  const fromPathname = makeFromPathname({ pathname: window.location.pathname });

  if (!fromPathname.isStationDetail()) {
    return {};
  }

  // these shouldn't be declared above the short circuit
  // eslint-disable-next-line one-var
  const stationDetailComponent = document.querySelector('.component--station-detail'),
    stationDetailEl = stationDetailComponent.querySelector('.station-detail__data'),
    station = stationDetailEl
      ? JSON.parse(stationDetailEl.innerHTML)
      : {};

  return station;
}

/**
 * Use page type and name to determine targeting
 * values for setting up the ad
 *
 * @param {object} pageData - Page data from getPageTargeting
 * @param {string} urlPathname - Current Path
 * @returns {object} adTargetingData - Targeting Data for DFP
 */
function getAdTargeting(pageData) {
  /**
   * the initialgoogleAdManagerComponent ref used before and elsewhere, is inaccurate or stale and therefore,
   * a new ref was created within this method’s context to grab new data that occurs on SPA page change.
   */
  const googleAdEl = document.querySelector('.component--google-ad-manager'),
    { doubleclickBannerTag } = googleAdEl.dataset,
    currentStation = getCurrentStation(),
    /**
     * NOTE: This is a workaround to access process.env.NODE_ENV
     * because it is not available in client.js.
     */
    { env } = googleAdEl.dataset,
    // this query selector should always succeed
    firstNmcTag = document.querySelector('meta[name^="nmc:"]'),
    hasNmcTags = !!firstNmcTag,
    isNmcDataImported = hasNmcTags && firstNmcTag.getAttribute('data-was-imported') === 'true',
    shouldUseNmcTags = hasNmcTags && !isNmcDataImported,
    siteZone = doubleclickPrefix.concat('/', doubleclickBannerTag),
    adTargetingData = getInitialAdTargetingData(shouldUseNmcTags, currentStation, pageData);

  // Set up targeting and ad paths based on current page
  switch (pageData.page) {
    case 'article':
    case 'vgallery':
      adTargetingData.siteZone = siteZone.concat('/', pageData.pageName, '/', pageData.pageName);
      break;
    case 'homepage':
      adTargetingData.siteZone = siteZone.concat('/', 'home', '/', pageTypeTagSection);
      break;
    case 'sectionFront':
      adTargetingData.siteZone = siteZone.concat('/', pageData.pageName, '/article');
      break;
    case 'stationsDirectory':
      adTargetingData.siteZone = siteZone.concat(`/${pageData.pageName}/${pageTypeTagStationsDirectory}`);
      break;
    case 'stationDetail':
      const stationBannerTag = env === 'production'
        ? doubleclickBannerTag
        : currentStation.doubleclick_bannertag;

      adTargetingData.siteZone = siteZone.concat('/', stationBannerTag, pageTypeTagStationDetail);
      break;
    case 'topicPage':
      // Must remain tag for targeting in DFP unless a change is made in the future to update it there
      adTargetingData.siteZone = siteZone.concat('/', 'tag', '/', pageTypeTagSection);
      break;
    case 'authorPage':
      adTargetingData.siteZone = siteZone.concat('/', 'show', '/', pageTypeTagArticle);
    default:
  }

  return adTargetingData;
}

/**
 * Create ad slots with targeting
 *
 * @param {array} adSlots - Ad Slots to set up
 */
function createAds(adSlots) {
  const queryParams = urlParse(window.location, true).query,
    contentType = getMetaTagContent('property', OG_TYPE),
    pageData = getPageData(window.location.pathname, contentType),
    adTargetingData = getAdTargeting(pageData),
    ads = [];

  googletag.cmd.push(function () {
    // Set refresh value on page level
    googletag.pubads().setTargeting('refresh', (refreshCount++).toString());

    for (const adSlot of adSlots) {
      const ad = adSlot.querySelector('.google-ad-manager__slot'),
        adSize = adSlot.getAttribute('data-ad-size'),
        adPosition = adSlot.getAttribute('data-ad-position'),
        adLocation = adSlot.getAttribute('data-ad-location'),
        pubAds = googletag.pubads(),
        sizeMapping = adMapping.sizeMapping[adSize];
      let slot;

      if (adSize === 'outOfPage') {
        slot = googletag.defineOutOfPageSlot(adTargetingData.siteZone, ad.id);
        updateSkinStyles(true);
      } else {
        slot = googletag.defineSlot(
          adTargetingData.siteZone,
          [adSizes[adSize].defaultSize],
          ad.id
        );

        slot.defineSizeMapping(sizeMapping);
      }

      slot
        .setTargeting('station', adTargetingData.targetingRadioStation)
        .setTargeting('genre', adTargetingData.targetingGenre)
        .setTargeting('cat', adTargetingData.targetingCategory)
        .setTargeting('tag', adTargetingData.targetingTags)
        .setTargeting('pid', adTargetingData.targetingPageId)
        .setTargeting('pos', adPosition)
        .setTargeting('loc', adLocation)
        .setTargeting('adtest', queryParams.adtest || '')
        .addService(pubAds);

      if (adTargetingData.targetingMarket) {
        slot.setTargeting('market', adTargetingData.targetingMarket);
      }
      if (adSize === 'sharethrough-tag') {
        slot.setTargeting('strnativekey', sharethroughPlacementKey);
      }

      // Right rail and inline gallery ads need unique names
      if (rightRailAdSizes.includes(adSize)) {
        slot.setTargeting('pos', adPosition + (numRightRail++).toString());
      }

      if (document.querySelector('.component--gallery') && adPosition === 'leader') {
        slot.setTargeting('pos', adPosition + (numGalleryInline++).toString());
      } else if (document.querySelector('.component--stations-directory') && adPosition === 'leader') {
        slot.setTargeting('pos', adPosition + (numStationsDirectoryInline++).toString());
      }

      if (adTargetingData.targetingAuthors.length) {
        slot.setTargeting('author', adTargetingData.targetingAuthors);
      }

      // Attach to the global ads array
      allAdSlots[ad.id] = slot;
      ads.push(ad);
    }

    amazonTam.fetchAPSBids(allAdSlots, () => {
      ads.forEach(ad => {
        const adSlot = allAdSlots[ad.id];

        googletag.display(ad.id);

        // 'atf' ads need to be requested together on page load, do not observe
        if (adSlot.getTargeting('loc')[0] === 'atf') {
          initialPageAdSlots.push(adSlot);
        } else {
          // Attach the observer for lazy loading
          observer.observe(ad);
        }
      });

      googletag.pubads().refresh(initialPageAdSlots);
    });
  });
}

/**
 * Resize the station-carousels if there is a skin
 *
 * @returns {function} function that resets elements to original styles
 */
function resizeForSkin() {
  const contentDiv = document.querySelector('.layout__content'),
    stationCarousels = document.querySelectorAll('.component--stations-carousel'),

    origCarouselStyles = [];

  stationCarousels.forEach((elem) => {
    const { margin, width } = window.getComputedStyle(elem);

    origCarouselStyles.push({ margin, width });

    Object.assign(elem.style, {
      'margin-left': `calc((100% - ${contentDiv.clientWidth}px)/2)`,
      width: `${contentDiv.clientWidth}px`
    });
  });

  return () => {
    stationCarousels.forEach((elem, ind) => {
      const { margin, width } = origCarouselStyles[ind];

      Object.assign(elem.style, { margin, width });
    });
  };
}

/**
 * @returns {function} that debounces refreshAllSlots, and verifies window.innerWith.
 */
function debounceRefresh() {
  return (
    _debounce(() => {
      // Check for a change in screen width to prevent an unneeded refresh when scrolling on mobile.
      if (window.innerWidth != windowWidth) {
        windowWidth = window.innerWidth;
        refreshAllSlots();
      };
    }, 500)
  );
}


/**
 * Tells a list of ads to stop refreshing, whether they've loaded yet or not.
 *
 * @param {string[]} ads
 */
window.disableAdRefresh = function (ads) {
  ads.forEach(ad => disabledRefreshAds.add(ad));
};

/**
 * Legacy code ported over from frequency to implement the takeover.
 *
 * @param {string} imageUrl
 * @param {string} linkUrl
 * @param {string} backgroundColor
 * @param {string} position
 */
window.freq_dfp_takeover = function (imageUrl, linkUrl, backgroundColor, position) {
  updateSkinStyles(true);
  const skinDiv = 'freq-dfp--bg-skin',
    skinClass = 'advertisement--full',
    adType = 'fullpageBanner',
    bgdiv = document.createElement('div'),
    globalDiv = document.querySelector('.layout__topSection') || document.querySelector('.layout__top'),
    resetElements = resizeForSkin();

  // Include our default bg color
  if (typeof backgroundColor == 'undefined') {
    backgroundColor = '#FFF';
  }
  // Include our default bg position
  if (typeof position == 'undefined') {
    position = 'absolute';
  }


  bgdiv.setAttribute('id', skinDiv);
  bgdiv.setAttribute('class', skinClass);
  bgdiv.setAttribute('data-ad-type', adType);
  bgdiv.style.position = position;

  // If 'fixed', we need to add some scrolling treatment.
  if (position == 'fixed') {
    window.onscroll = function () {
      // Need browser compatibility checks.
      const supportPageOffset = window.pageXOffset !== undefined,
        isCSS1Compat = (document.compatMode || '') === 'CSS1Compat' ? document.documentElement.scrollTop : document.body.scrollTop,
        currentYscroll = supportPageOffset ? window.pageYOffset : isCSS1Compat,
        stickyTop = document.getElementsByClassName('radiocom-nav')[0].clientHeight;

      if (stickyTop && currentYscroll >= stickyTop) {
        bgdiv.style.position = 'fixed';
        bgdiv.style['padding-top'] = '0px';
      } else {
        bgdiv.style.position = 'absolute';
      }
    };
  }

  if (linkUrl) {
    bgdiv.onclick = window.open.bind(this, linkUrl, '_new');
  }

  // Does a takeover image exist?
  if (imageUrl) {
    const imgElem = document.createElement('div'),
      bgImg = new Image(),
      mainDiv = document.getElementsByTagName('body')[0];

    imgElem.style['background-image'] = `url(${imageUrl})`;
    imgElem.setAttribute('class', 'dfp-takeover-skin');
    bgdiv.appendChild(imgElem);

    bgImg.src = imageUrl;
    bgImg.onload = function () {
      // Only include background div if img is a takeover.
      // DFP seems to include a 1x1 pixel image even with no takeover.
      if (typeof bgImg.width !== 'undefined' && bgImg.width > 1) {
        // Create our wrapper div element

        mainDiv.classList.add('has-fullpage-ad');
      }
    };
  }

  if (globalDiv) {
    document.body.style.backgroundColor = backgroundColor;

    // insert after the nav so that its absolute positioning doesn't start under the nav
    globalDiv.parentNode.insertBefore(bgdiv, globalDiv.nextSibling);
  }

  /**
   * Reverses changes done by dfp takeover. It's defined in this scope
   * so it can have access to `bgdiv` and `globaldiv`
   *
   */
  clearDfpTakeover = () => {
    const mainDiv = document.getElementsByTagName('body')[0];

    bgdiv.remove();
    if (mainDiv) {
      mainDiv.classList.remove('has-fullpage-ad');
    }

    resetElements();

    updateSkinStyles(false);
  };
};


