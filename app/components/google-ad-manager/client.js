'use strict';

require('intersection-observer');

let adMapping = require('./adMapping'),
  adSizes = adMapping.adSizes,
  refreshCount = 0,
  allAdSlots = {},
  initialAdRequestComplete = false,
  adsRefreshing = false,
  initialPageAdSlots = [],
  clearDfpTakeover = () => {},
  numRightRail = 1;
const doubleclickPrefix = '21674100491',
  doubleclickBannerTag = 'NTL.RADIO',
  rightRailAdSizes = ['medium-rectangle', 'half-page', 'half-page-topic'],
  doubleclickPageTypeTagArticle = 'article',
  doubleclickPageTypeTagSection = 'sectionfront',
  doubleclickPageTypeTagTag = 'tag',
  doubleclickPageTypeTagAuthor = 'authors',
  adRefreshInterval = '45000', // Time in milliseconds for ad refresh
  targetingNationalRadioStation = 'natlrc',
  targetingGenre = 'aaa',
  targetingCategory = 'music',
  urlParse = require('url-parse'),
  lazyLoadObserverConfig = {
    root: null,
    rootMargin: '0px',
    threshold: 0
  },
  observer = new IntersectionObserver(lazyLoadAd, lazyLoadObserverConfig);

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
  setAdsIDs(true);
}, false);

// Set up ads when navigating in SPA
document.addEventListener('google-ad-manager-mount', function () {
  if (initialAdRequestComplete) {
    // code to run when vue mounts/updates
    if (googletag.pubadsReady) { // Only do this if the service was created
      googletag.pubads().updateCorrelator(); // Force correlator update on new pages
    }
    setAdsIDs();
  }
});

// Reset data when navigating in SPA
document.addEventListener('google-ad-manager-dismount', function () {
  clearDfpTakeover();
  // undo style changes to billboard

  // Reset slot arrays/objects
  allAdSlots = {},
  initialPageAdSlots = [],
  numRightRail = 1,
  refreshCount = 0;

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
    let id = event.slot.getSlotElementId(),
      adSlot = document.getElementById(id);

    const isOOP = adSlot.classList.contains('google-ad-manager__slot--outOfPage');

    if (isOOP) {
      updateSkinStyles(!(event.isEmpty));
    }
    if (event.isEmpty) {
      adSlot.parentElement.style.display = 'none';
    } else {
      // Unhide parent incase this was a refresh after an empty response
      adSlot.parentElement.style.display = 'flex';
    }
  });
});

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
function setAdsIDs(initialRequest = false) {
  Object.keys(adSizes).forEach((adSize) => {
    let adSlots = document.getElementsByClassName(`google-ad-manager__slot--${adSize}`);

    [...adSlots].forEach((slot, index) => {
      slot.id = slot.classList[1].concat('-', index);
    });
  });
  setAds(initialRequest);
}

/**
 * use ids of ad slots on page to create google ad slots and display them
 *
 * @param {boolean} initialRequest - Is this the first time through ad setup?
 */
function setAds(initialRequest = false) {
  let page,
    pageName,
    siteZone = doubleclickPrefix.concat('/', doubleclickBannerTag),
    urlPathname = window.location.pathname.replace(/^\/|\/$/g, ''),
    targetingTags = [],
    targetingPageId = '',
    targetingAuthors = [];

  if (document.getElementsByTagName('article').length > 0) {
    page = pageName = 'article';
  } else {
    if (urlPathname === '') {
      page = 'homepage';
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
  }

  // Set up targeting and ad paths based on current page
  switch (page) {
    case 'article':
      targetingTags = [doubleclickPageTypeTagArticle];
      [...document.querySelectorAll('.component--tags .tags__item')].forEach(tag => {
        targetingTags.push(tag.getAttribute('data-tag'));
      });
      targetingPageId = (doubleclickPageTypeTagArticle + '_' + urlPathname.split('/').pop()).substring(0, 39);
      [...document.querySelectorAll('.component--article .author')].forEach(tag => {
        targetingAuthors.push(tag.getAttribute('data-author').replace(/\s/, '-').toLowerCase());
      });
      siteZone = siteZone.concat('/', pageName, '/', doubleclickPageTypeTagArticle);
      break;
    case 'homepage':
      targetingTags = [doubleclickPageTypeTagSection, page];
      targetingPageId = page;
      siteZone = siteZone.concat('/', 'home', '/', doubleclickPageTypeTagSection);
      break;
    case 'sectionFront':
      targetingTags = [doubleclickPageTypeTagArticle, pageName];
      targetingPageId = pageName;
      siteZone = siteZone.concat('/', pageName, '/article');
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
        .setTargeting('station', targetingNationalRadioStation)
        .setTargeting('genre', targetingGenre)
        .setTargeting('cat', targetingCategory)
        .setTargeting('tag', targetingTags)
        .setTargeting('pid', targetingPageId)
        .setTargeting('pos', adPosition)
        .setTargeting('loc', adLocation)
        .setTargeting('adtest', queryParams.adtest || '')
        .addService(pubAds);

      if (rightRailAdSizes.includes(adSize)) {
        slot.setTargeting('pos', adPosition + (numRightRail++).toString());
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
