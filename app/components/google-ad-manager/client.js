'use strict';

require('intersection-observer');

let adMapping = require('./adMapping'),
  adSizes = adMapping.adSizes,
  refreshCount = 0,
  allAdSlots = {};
const doubleclickPrefix = '21674100491',
  doubleclickBannerTag = 'NTL.RADIO',
  rightRailAdSizes = ['medium-rectangle', 'half-page'],
  doubleclickPageTypeTagArticle = 'article',
  doubleclickPageTypeTagSection = 'sectionfront',
  doubleclickPageTypeTagTag = 'tag',
  adRefreshInterval = '120000', // Time in milliseconds for ad refresh
  adSlots = document.getElementsByClassName('google-ad-manager__slot'),
  targetingMarket = require('../../services/client/market'),
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

// mount listener for vue
document.addEventListener('google-ad-manager-mount', function () {
  // code to run when vue mounts/updates
  googletag.pubads().updateCorrelator(); // Force correlator update on new pages
  setAdsIDs();
});

document.addEventListener('google-ad-manager-dismount', function () {
  allAdSlots = {};
  googletag.cmd.push(function () {
    googletag.destroySlots();
  });

  // Remove event listeners so they don't double up
  googletag.pubads().removeEventListener('slotRenderEnded');
});

/**
 * create and add unique ids to each ad slot on page
 */
function setAdsIDs() {
  Object.keys(adSizes).forEach((adSize) => {
    let adSlots = document.getElementsByClassName(`google-ad-manager__slot--${adSize}`);

    [...adSlots].forEach((slot, index) => {
      slot.id = slot.classList[1].concat('-', index);
    });
  });
  setAds();
}

/**
 * use ids of ad slots on page to create google ad slots and display them
 */
function setAds() {
  let page,
    pageName,
    siteZone = doubleclickPrefix.concat('/', doubleclickBannerTag),
    urlPathname = window.location.pathname.replace(/^\/|\/$/, ''),
    targetingTags = [],
    targetingPageId = '',
    targetingAuthors = [];

  if (document.getElementsByTagName('article').length > 0) {
    page = pageName = 'article';
  } else {
    if (urlPathname === '') {
      page = 'homepage';
    } else if (urlPathname.indexOf('tags/') !== -1) {
      page = 'tagPage';
      pageName = urlPathname.replace('tags/', '');
    } else {
      page = 'genrePage';
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
      targetingPageId = doubleclickPageTypeTagArticle + '_' + urlPathname.split('/').pop().substring(0, 35);
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
    case 'genrePage':
      targetingTags = [doubleclickPageTypeTagArticle, `${pageName}`];
      targetingPageId = pageName;
      siteZone = siteZone.concat('/', pageName, '/article');
      break;
    case 'tagPage':
      targetingTags = [doubleclickPageTypeTagTag, doubleclickPageTypeTagSection, `${pageName}`];
      targetingPageId = doubleclickPageTypeTagTag + '_' + pageName;
      siteZone = siteZone.concat('/', 'tags', '/', doubleclickPageTypeTagSection);
      break;
    default:
  }

  googletag.cmd.push(async function () {
    const queryParams = urlParse(window.location, true).query;

    for (let ad of adSlots) {
      const adSize = ad.getAttribute('data-adSize'),
        pubAds = googletag.pubads();
      let marketName = await targetingMarket.getName(),
        slot,
        sizeMapping = adMapping.sizeMapping[adSize];

      if (adSize === 'outOfPage') {
        slot = googletag.defineOutOfPageSlot(siteZone, ad.id);
      } else {
        slot = googletag.defineSlot(
          siteZone,
          [adSizes[adSize].defaultSize],
          ad.id
        );

        slot
          .defineSizeMapping(sizeMapping);
      }

      pubAds.setCentering(true);
      slot
        .addService(pubAds);

      if (rightRailAdSizes.includes(adSize)) {
        slot.setTargeting('rightRail', true);
      }

      slot.setTargeting('refresh', refreshCount)
        .setTargeting('market', marketName.replace(' ','').split(',')[0].toLowerCase())
        .setTargeting('station', targetingNationalRadioStation)
        .setTargeting('genre', targetingGenre)
        .setTargeting('cat', targetingCategory)
        .setTargeting('tag', targetingTags)
        .setTargeting('pid', targetingPageId)
        .setTargeting('pos', ad.parentNode.getAttribute('data-ad-position'))
        .setTargeting('loc', ad.parentNode.getAttribute('data-ad-location'))
        .setTargeting('adtest', queryParams.adtest || '');

      if (targetingAuthors.length) {
        slot.setTargeting('author', targetingAuthors);
      }

      // Attach to the global ads array
      allAdSlots[ad.id] = slot;

      googletag.display(ad.id);

      if (adSize === 'outOfPage') {
        // OOP slots should refresh on page laod
        googletag.pubads().refresh([slot]);
      } else {
        // Attach the observer for lazy loading
        observer.observe(ad);
      }
    }
  });

  // Handle right rail refresh
  googletag.pubads().addEventListener('impressionViewable', event => {
    const { slot } = event,
      rightRail = slot.getTargeting('rightRail');

    if (rightRail.length) {
      slot.setTargeting('refresh', refreshCount++);
      setTimeout(function () {
        googletag.pubads().refresh([slot]);
      }, adRefreshInterval);
    }
  });

  // Handle collapsing ads
  googletag.pubads().addEventListener('slotRenderEnded', event => {
    let id = event.slot.getSlotElementId(),
      adSlot = document.getElementById(id);

    if (event.isEmpty) {
      adSlot.parentElement.style.display = 'none';
    } else {
      // Unhide parent incase this was a refresh after an empty response
      adSlot.parentElement.style.display = 'block';
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
  const skinDiv = 'freq-dfp--bg-skin',
    skinClass = 'advertisement--full',
    adType = 'fullpageBanner',
    bgdiv = document.createElement('div'),
    globalDiv = document.getElementsByClassName('layout')[0],
    transparentSections = [...document.getElementsByClassName('google-ad-manager__slot--billboard'), ...document.getElementsByClassName('google-ad-manager--billboard')];

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

  transparentSections.forEach((section) => {
    section.style.backgroundColor = 'transparent';
  });
};
