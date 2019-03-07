'use strict';

require('intersection-observer');

const adMapping = require('./adMapping'),
  adSizes = adMapping.adSizes,
  doubleclickPrefix = '21674100491',
  doubleclickBannerTag = 'NTL.RADIO',
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
  initialAdRequestComplete = false,
  adsRefreshing = false,
  initialPageAdSlots = [],
  clearDfpTakeover = () => {},
  numRightRail = 1,
  numGalleryInline = 1,
  numStationsDirectoryInline = 1,
  targetingRadioStation,
  targetingGenre = 'aaa',
  targetingCategory = 'music',
  page,
  pageName,
  siteZone = doubleclickPrefix.concat('/', doubleclickBannerTag),
  urlPathname = window.location.pathname.replace(/^\/|\/$/g, ''),
  targetingTags = [],
  targetingPageId = '',
  targetingAuthors = [];

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

// On page load set up sizeMappings
adMapping.setupSizeMapping();

// listener to ensure lytics has been setup in GTM
document.addEventListener('gtm-lytics-setup', function () {
  setupAds();
}, false);

/**
 * Reset ads settings
 *
 * @param {boolean} resetSetupAds
 */
function resetAds(resetSetupAds) {
  clearDfpTakeover();
  // undo style changes to billboard

  // Reset slot arrays/objects
  allAdSlots = {};
  initialPageAdSlots = [];
  numRightRail = 1;
  numGalleryInline = 1;
  numStationsDirectoryInline = 1;
  targetingRadioStation = null;
  targetingGenre = 'aaa';
  targetingCategory = 'music';
  refreshCount = 0;
  page = '';
  pageName = '';
  siteZone = doubleclickPrefix.concat('/', doubleclickBannerTag);
  urlPathname = window.location.pathname.replace(/^\/|\/$/g, '');
  targetingTags = [];
  targetingPageId = '';
  targetingAuthors = [];

  googletag.cmd.push(function () {
    googletag.destroySlots();
  });

  if (resetSetupAds) {
    setupAds();
  }
}

// Set up ads when navigating in SPA or resizing window
document.addEventListener('google-ad-manager-mount', resetAds);
document.addEventListener('inlineAdsInserted', resetAds);

// Reset data when navigating in SPA
document.addEventListener('google-ad-manager-dismount', function () {
  console.log("ad manager dismount");
  document.removeEventListener('inlineAdsInserted', resetAds);
  resetAds(false);
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
 * create and add unique ids to each ad slot on page
 *
 * @param {boolean} initialRequest - Is this the first time through ad setup?
 */
function setupAds(initialRequest = false) {
  if (initialAdRequestComplete) { // not working, set to false?
    console.log("set up ads");
    Object.keys(adSizes).forEach((adSize) => {
      let adSlots = document.getElementsByClassName(`google-ad-manager__slot--${adSize}`);

      [...adSlots].forEach((slot, index) => {
        slot.id = slot.classList[1].concat('-', index);
      });
    });
    setAds(initialRequest);
  } else {
    console.log("do not set up ads");
  }
}

/**
 * use ids of ad slots on page to create google ad slots and display them
 *
 * @param {boolean} initialRequest - Is this the first time through ad setup?
 */
function setAds(initialRequest = false) {
  if (urlPathname === '') {
    page = 'homepage';
  } else if (document.getElementsByTagName('article').length > 0) {
    page = pageName = 'article';
  } else if (document.querySelector('.component--gallery')) {
    page = pageName = 'vgallery';
  } else if (document.querySelector('.component--stations-directory')) {
    page = 'stationsDirectory';
    pageName = urlPathname.replace('/', '_');
  } else if (document.querySelector('.component--station-detail')) {
    page = 'stationDetail';
    pageName = urlPathname.split('/')[0];
  } else if (document.querySelector('.component--topic-page')) {
    page = 'topicPage';
    pageName = urlPathname.replace(/[^\/]+\//, '');
  } else if (document.querySelector('.component--author-page')) {
    page = 'authorPage';
    pageName = urlPathname.replace('/', '_');
  } else {
    page = 'sectionFront';
    pageName = urlPathname;
  }

  setTargeting(initialRequest);
}

/**
 * Use page type and name to determine targeting
 * values for setting up the ad
 *
 * @param {boolean} initialRequest - Is this the first time through ad setup?
 */
function setTargeting(initialRequest) {
  // Set up targeting and ad paths based on current page
  switch (page) {
    case 'article':
    case 'vgallery':
      targetingTags = [pageName];
      [...document.querySelectorAll('.component--tags .tags__item')].forEach(tag => {
        targetingTags.push(tag.getAttribute('data-tag'));
      });
      targetingPageId = (pageName + '_' + urlPathname.split('/').pop()).substring(0, 39);
      [...document.querySelectorAll('.component--article .author')].forEach(tag => {
        targetingAuthors.push(tag.getAttribute('data-author').replace(/\s/, '-').toLowerCase());
      });
      siteZone = siteZone.concat('/', pageName, '/', pageName);
      break;
    case 'homepage':
      targetingTags = [doubleclickPageTypeTagSection, page];
      targetingPageId = page;
      siteZone = siteZone.concat('/', 'home', '/', doubleclickPageTypeTagSection);
      break;
    case 'sectionFront':
      targetingTags = [doubleclickPageTypeTagSection, pageName];
      targetingPageId = pageName;
      siteZone = siteZone.concat('/', pageName, '/article');
      break;
    case 'stationsDirectory':
      targetingTags = [doubleclickPageTypeTagStationsDirectory, pageName];
      targetingPageId = pageName;
      siteZone = siteZone.concat(`/${pageName}/${doubleclickPageTypeTagStationsDirectory}`);
      if (document.querySelector('directory-page--music')) {
        targetingCategory = 'music';
        targetingGenre = urlPathname.replace('stations/music/', '');
      } else if (document.querySelector('directory-page--news-talk')) {
        targetingCategory = targetingGenre = 'news-talk';
      } else if (document.querySelector('directory-page--sports')) {
        targetingCategory = targetingGenre = 'sports';
      }
      break;
    case 'stationDetail':
      targetingTags = [doubleclickPageTypeTagStationDetail, pageName];
      targetingPageId = pageName;
      siteZone = siteZone.concat(`/${pageName}/${doubleclickPageTypeTagStationDetail}`);
      const stationDetailComponent = document.querySelector('.component--station-detail');

      targetingRadioStation = stationDetailComponent.getAttribute('data-station-slug');
      targetingCategory = targetingGenre = stationDetailComponent.getAttribute('data-station-category');
      if (targetingCategory == 'music') {
        targetingGenre = stationDetailComponent.getAttribute('data-station-genre');
      }
      break;
    case 'topicPage':
      targetingTags = [doubleclickPageTypeTagTag, doubleclickPageTypeTagSection, pageName];
      targetingPageId = doubleclickPageTypeTagTag + '_' + pageName;
      // Must remain tag for targeting in DFP unless a change is made in the future to update it there
      siteZone = siteZone.concat('/', 'tag', '/', doubleclickPageTypeTagSection);
      break;
    case 'authorPage':
      targetingTags = [doubleclickPageTypeTagArticle, doubleclickPageTypeTagAuthor];
      targetingPageId = pageName;
      siteZone = siteZone.concat('/', 'show', '/', doubleclickPageTypeTagArticle);
    default:
  }

  createAds(initialRequest);
}

/**
 * Create ad slots with targeting
 *
 * @param {boolean} initialRequest - Is this the first time through ad setup?
 */
function createAds(initialRequest) {
  googletag.cmd.push(function () {
    const queryParams = urlParse(window.location, true).query;
    let adSlots = document.getElementsByClassName('component--google-ad-manager');

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
        slot = googletag.defineOutOfPageSlot(siteZone, ad.id);
        updateSkinStyles(true);
      } else {
        slot = googletag.defineSlot(
          siteZone,
          [adSizes[adSize].defaultSize],
          ad.id
        );

        slot
          .defineSizeMapping(sizeMapping);
      }

      slot
        .setTargeting('station', targetingRadioStation || targetingNationalRadioStation)
        .setTargeting('genre', targetingGenre)
        .setTargeting('cat', targetingCategory)
        .setTargeting('tag', targetingTags)
        .setTargeting('pid', targetingPageId)
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

      if (targetingAuthors.length) {
        slot.setTargeting('author', targetingAuthors);
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
    if (initialRequest) {
      initialAdRequestComplete = true;
    }
  });
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
    globalDiv = document.getElementsByClassName('layout')[0];

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

    updateSkinStyles(false);
  };
};
