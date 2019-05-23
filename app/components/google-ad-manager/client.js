'use strict';

require('intersection-observer');

const adMapping = require('./adMapping'),
  adSizes = adMapping.adSizes,
  doubleclickPrefix = '21674100491',
  doubleclickBannerTag = document.querySelector('.component--google-ad-manager').getAttribute('data-doubleclick-banner-tag'),
  rightRailAdSizes = ['medium-rectangle', 'half-page', 'half-page-topic'],
  doubleclickPageTypeTagArticle = 'article',
  doubleclickPageTypeTagSection = 'sectionfront',
  doubleclickPageTypeTagStationsDirectory = 'stationsdirectory',
  doubleclickPageTypeTagStationDetail = 'station',
  doubleclickPageTypeTagTag = 'tag',
  doubleclickPageTypeTagAuthor = 'authors',
  adRefreshInterval = '60000', // Time in milliseconds for ad refresh
  targetingNationalRadioStation = 'natlrc',
  urlParse = require('url-parse'),
  lazyLoadObserverConfig = {
    root: null,
    rootMargin: '0px',
    threshold: 0
  },
  observer = new IntersectionObserver(lazyLoadAd, lazyLoadObserverConfig);
let refreshCount = 0,
  allAdSlots = {},
  adsRefreshing = false,
  initialPageAdSlots = [],
  clearDfpTakeover = () => {},
  numRightRail = 1,
  numGalleryInline = 1,
  numStationsDirectoryInline = 1,
  adIndices = {},
  adsMounted = false;

// On page load set up sizeMappings
adMapping.setupSizeMapping();

// Listener to ensure lytics has been setup in GTM (Google Tag Manager)
document.addEventListener('gtm-lytics-setup', () => {
  initializeAds();
}, false);

// Set up ads when navigating in SPA
document.addEventListener('google-ad-manager-mount', () => {
  // This will allow initializeAds to trigger ad refresh
  adsMounted = true;
});

// Reset data when navigating in SPA
document.addEventListener('google-ad-manager-dismount', () => {
  googletag.cmd.push(function () {
    googletag.destroySlots();
  });
});

// Create listeners inside of the context of having googletag.pubads()
googletag.cmd.push(() => {
  // Handle right rail refresh via DFP event trigger
  googletag.pubads().addEventListener('impressionViewable', event => {
    // Trigger the fresh once the first ad registers an impression
    if (allAdSlots[event.slot.getSlotElementId()] && !adsRefreshing) {
      adsRefreshing = true;
      googletag.pubads().setTargeting('refresh', (refreshCount++).toString());
      setTimeout(function () {
        clearDfpTakeover();
        // Refresh all ads
        googletag.pubads().refresh(null, { changeCorrelator: false });
        // Remove the observers
        [...document.querySelectorAll('.google-ad-manager__slot')].forEach((adSlot) => {
          observer.unobserve(adSlot);
        });
        adsRefreshing = false;
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
      googletag.pubads().refresh([allAdSlots[change.target.id]], {changeCorrelator: false});
      observer.unobserve(change.target);
    }
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
    billboard.style['margin-bottom'] = '-0.875em';
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
    const dfpContainer = slot.querySelector('.google-ad-manager__slot');
    let [, slotSize] = adSizeRegex.exec(dfpContainer.classList[1]);

    if (typeof adIndices[slotSize] === 'undefined') {
      adIndices[slotSize] = 1;
    } else {
      adIndices[slotSize]++;
    }
    dfpContainer.id = dfpContainer.classList[1].concat('-', adIndices[slotSize]);
  });

  createAds(adSlots);
}

/**
 * use ids of ad slots on page to create google ad slots and display them
 *
 * @param {string} urlPathname
 * @returns {object} pageData
 */
function getPageTargeting(urlPathname) {
  let pageData = {};

  if (urlPathname === '') {
    pageData.page = 'homepage';
  } else if (document.getElementsByTagName('article').length > 0) {
    pageData.page = pageData.pageName = 'article';
  } else if (document.querySelector('.component--gallery')) {
    pageData.page = pageData.pageName = 'vgallery';
  } else if (document.querySelector('.component--stations-directory')) {
    pageData.page = 'stationsDirectory';
    pageData.pageName = urlPathname.replace('/', '_');
  } else if (document.querySelector('.component--station-detail')) {
    pageData.page = 'stationDetail';
    pageData.pageName = urlPathname.split('/')[0];
  } else if (document.querySelector('.component--topic-page')) {
    pageData.page = 'topicPage';
    pageData.pageName = urlPathname.replace(/[^\/]+\//, '');
  } else if (document.querySelector('.component--author-page')) {
    pageData.page = 'authorPage';
    pageData.pageName = urlPathname.replace('/', '_');
  } else {
    pageData.page = 'sectionFront';
    pageData.pageName = urlPathname;
  }

  return pageData;
}

/**
 * Use page type and name to determine targeting
 * values for setting up the ad
 *
 * @param {object} pageData - Page data from getPageTargeting
 * @param {string} urlPathname - Current Path
 * @returns {object} adTargetingData - Targeting Data for DFP
 */
function getAdTargeting(pageData, urlPathname) {
  let siteZone = doubleclickPrefix.concat('/', doubleclickBannerTag),
    adTargetingData = {
      targetingRadioStation: null,
      targetingGenre: 'aaa',
      targetingCategory: 'music',
      targetingAuthors: []
    };

  // Set up targeting and ad paths based on current page
  switch (pageData.page) {
    case 'article':
    case 'vgallery':
      adTargetingData.targetingTags = [pageData.pageName];
      [...document.querySelectorAll('.component--tags .tags__item')].forEach(tag => {
        adTargetingData.targetingTags.push(tag.getAttribute('data-tag'));
      });
      adTargetingData.targetingPageId = (pageData.pageName + '_' + urlPathname.split('/').pop()).substring(0, 39);
      [...document.querySelectorAll('.component--article .author')].forEach(tag => {
        adTargetingData.targetingAuthors.push(tag.getAttribute('data-author').replace(/\s/, '-').toLowerCase());
      });
      adTargetingData.siteZone = siteZone.concat('/', pageData.pageName, '/', pageData.pageName);
      break;
    case 'homepage':
      adTargetingData.targetingTags = [doubleclickPageTypeTagSection, pageData.page];
      adTargetingData.targetingPageId = pageData.page;
      adTargetingData.siteZone = siteZone.concat('/', 'home', '/', doubleclickPageTypeTagSection);
      break;
    case 'sectionFront':
      adTargetingData.targetingTags = [doubleclickPageTypeTagSection, pageData.pageName];
      adTargetingData.targetingPageId = pageData.pageName;
      adTargetingData.siteZone = siteZone.concat('/', pageData.pageName, '/article');
      break;
    case 'stationsDirectory':
      adTargetingData.targetingTags = [doubleclickPageTypeTagStationsDirectory, pageData.pageName];
      adTargetingData.targetingPageId = pageData.pageName;
      adTargetingData.siteZone = siteZone.concat(`/${pageData.pageName}/${doubleclickPageTypeTagStationsDirectory}`);
      if (document.querySelector('.directory-page--music')) {
        adTargetingData.targetingCategory = 'music';
        adTargetingData.targetingGenre = urlPathname.replace('stations/music/', '');
      } else if (document.querySelector('.directory-page--news-talk')) {
        adTargetingData.targetingCategory = adTargetingData.targetingGenre = 'news-talk';
      } else if (document.querySelector('.directory-page--sports')) {
        adTargetingData.targetingCategory = adTargetingData.targetingGenre = 'sports';
      }
      break;
    case 'stationDetail':
      adTargetingData.targetingTags = [doubleclickPageTypeTagStationDetail, pageData.pageName];
      adTargetingData.targetingPageId = pageData.pageName;
      adTargetingData.siteZone = siteZone.concat(`/${pageData.pageName}/${doubleclickPageTypeTagStationDetail}`);
      const stationDetailComponent = document.querySelector('.component--station-detail');

      adTargetingData.targetingRadioStation = stationDetailComponent.getAttribute('data-station-slug');
      adTargetingData.targetingCategory = adTargetingData.targetingGenre = stationDetailComponent.getAttribute('data-station-category');
      if (adTargetingData.targetingCategory == 'music') {
        adTargetingData.targetingGenre = stationDetailComponent.getAttribute('data-station-genre');
      }
      break;
    case 'topicPage':
      adTargetingData.targetingTags = [doubleclickPageTypeTagTag, doubleclickPageTypeTagSection, pageData.pageName];
      adTargetingData.targetingPageId = doubleclickPageTypeTagTag + '_' + pageData.pageName;
      // Must remain tag for targeting in DFP unless a change is made in the future to update it there
      adTargetingData.siteZone = siteZone.concat('/', 'tag', '/', doubleclickPageTypeTagSection);
      break;
    case 'authorPage':
      adTargetingData.targetingTags = [doubleclickPageTypeTagArticle, doubleclickPageTypeTagAuthor];
      adTargetingData.targetingPageId = pageData.pageName;
      adTargetingData.siteZone = siteZone.concat('/', 'show', '/', doubleclickPageTypeTagArticle);
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
  const urlPathname = window.location.pathname.replace(/^\/|\/$/g, ''),
    queryParams = urlParse(window.location, true).query,
    pageData = getPageTargeting(urlPathname),
    adTargetingData = getAdTargeting(pageData, urlPathname);

  googletag.cmd.push(function () {
    // Set refresh value on page level
    googletag.pubads().setTargeting('refresh', (refreshCount++).toString());

    for (let adSlot of adSlots) {
      const ad = adSlot.querySelector('.google-ad-manager__slot'),
        adSize = adSlot.getAttribute('data-ad-size'),
        adPosition = adSlot.getAttribute('data-ad-position'),
        adLocation = adSlot.getAttribute('data-ad-location'),
        pubAds = googletag.pubads();
      let slot,
        sizeMapping = adMapping.sizeMapping[adSize];

      if (adSize === 'outOfPage') {
        slot = googletag.defineOutOfPageSlot(adTargetingData.siteZone, ad.id);
        updateSkinStyles(true);
      } else {
        slot = googletag.defineSlot(
          adTargetingData.siteZone,
          [adSizes[adSize].defaultSize],
          ad.id
        );

        slot
          .defineSizeMapping(sizeMapping);
      }

      slot
        .setTargeting('station', adTargetingData.targetingRadioStation || targetingNationalRadioStation)
        .setTargeting('genre', adTargetingData.targetingGenre)
        .setTargeting('cat', adTargetingData.targetingCategory)
        .setTargeting('tag', adTargetingData.targetingTags)
        .setTargeting('pid', adTargetingData.targetingPageId)
        .setTargeting('pos', adPosition)
        .setTargeting('loc', adLocation)
        .setTargeting('adtest', queryParams.adtest || '')
        .addService(pubAds);

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

      googletag.display(ad.id);

      // 'atf' ads need to be requested together on page load, do not observe
      if (adLocation === 'atf') {
        initialPageAdSlots.push(slot);
      } else {
        // Attach the observer for lazy loading
        observer.observe(ad);
      }
    }

    // Refresh all initial page slots
    googletag.pubads().refresh(initialPageAdSlots);
  });
}

/**
 * Resize the station-carousels if there is a skin
 *
 * @returns {function} function that resets elements to original styles
 */
function resizeForSkin() {
  const contentDiv = document.querySelector('.layout__content'),
    stationCarousels = document.querySelectorAll('.component--stations-carousel');

  let origCarouselStyles = [];
      
  stationCarousels.forEach((elem) => {
    const {margin, width} = window.getComputedStyle(elem);
        
    origCarouselStyles.push({margin, width});
        
    Object.assign(elem.style, {
      'margin-left': `calc((100% - ${contentDiv.clientWidth}px)/2)`,
      width: `${contentDiv.clientWidth}px`
    });
  });

  return () => {
    stationCarousels.forEach((elem, ind) => {
      const {margin, width} = origCarouselStyles[ind];

      Object.assign(elem.style, {margin, width});
    });
  };
}

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
    globalDiv = document.getElementsByClassName('layout')[0],
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
    globalDiv.prepend(bgdiv);
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
