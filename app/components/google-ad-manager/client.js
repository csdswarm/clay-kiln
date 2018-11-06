'use strict';

let adMapping = require('./adMapping'),
  adSizes = adMapping.adSizes,
  refreshCount = 0,
  googleDefinedSlots = [];
const doubleclickPrefix = '21674100491',
  doubleclickBannerTag = 'NTL.RADIO',
  doubleclickPageTypeTagArticle = 'article',
  doubleclickPageTypeTagSection = 'sectionfront',
  doubleclickPageTypeTagTag = 'tag',
  adRefreshInterval = '120000', // Time in milliseconds for ad refresh
  adSlots = document.getElementsByClassName('google-ad-manager__slot'),
  targetingMarket = require('../../services/client/market'),
  targetingNationalRadioStation = 'natlrc',
  targetingGenre = 'aaa',
  targetingCategory = 'music';

// On page load set up sizeMappings
adMapping.setupSizeMapping();

// mount listener for vue
document.addEventListener('google-ad-manager-mount', function () {
  // code to run when vue mounts/updates
  setAdsIDs();
});

document.addEventListener('google-ad-manager-dismount', function () {

  googleDefinedSlots = [];
  googletag.cmd.push(function () {
    googletag.destroySlots();
  });
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
    urlPathname = window.location.pathname.replace(/\/$/, ''),
    targetingTags = [],
    targetingPageId = '',
    targetingAuthors = [];

  if (document.getElementsByTagName('article').length > 0) {
    page = pageName = 'article';
  } else {
    if (urlPathname === '') {
      page = 'homepage';
    } else if (urlPathname.indexOf('/tags/') !== -1) {
      page = 'tagPage';
      pageName = urlPathname.replace('/tags/', '');
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
      siteZone = siteZone.concat('home', '/', doubleclickPageTypeTagSection);
      break;
    case 'genrePage':
      targetingTags = [doubleclickPageTypeTagArticle, `${pageName}`];
      targetingPageId = pageName;
      siteZone = siteZone.concat(pageName, '/article');
      break;
    case 'tagPage':
      targetingTags = [doubleclickPageTypeTagTag, doubleclickPageTypeTagSection, `${pageName}`];
      targetingPageId = doubleclickPageTypeTagTag + '_' + pageName;
      siteZone = siteZone.concat('tags', '/', pageName, '/', doubleclickPageTypeTagSection);
      break;
    default:
  }

  googletag.cmd.push(async function () {
    for (let ad of adSlots) {
      let marketName = await targetingMarket.getName(),
        adSize = ad.getAttribute('data-adSize'),
        sizeMapping = adMapping.sizeMapping[adSize],
        slot = googletag.defineSlot(
          siteZone,
          [adSizes[adSize].defaultSize],
          ad.id
        )
          .defineSizeMapping(sizeMapping)
          .addService(googletag.pubads())
          .setCollapseEmptyDiv(true)
          .setTargeting('refresh', refreshCount.toString())
          .setTargeting('market', marketName.replace(' ','').split(',')[0].toLowerCase())
          .setTargeting('station', targetingNationalRadioStation)
          .setTargeting('genre', targetingGenre)
          .setTargeting('cat', targetingCategory)
          .setTargeting('tag', targetingTags)
          .setTargeting('pid', targetingPageId);

      if (targetingAuthors.length) {
        slot.setTargeting('author', targetingAuthors);
      }

      googleDefinedSlots.push(slot);
      googletag.display(ad.id);
    }
    googletag.pubads().refresh(googleDefinedSlots);
  });
  setTimeout(refreshAds, adRefreshInterval);
}

/**
 * refresh all ad slots on page every set interval in ms
 */
function refreshAds() {
  refreshCount = refreshCount + 1;
  googletag.cmd.push(function () {
    for (let i in googleDefinedSlots) {
      if (googleDefinedSlots[i]) {
        googleDefinedSlots[i].setTargeting('refresh', refreshCount.toString());
      }
    }
    googletag.pubads().refresh(googleDefinedSlots);
  });
  setTimeout(refreshAds, adRefreshInterval);
}
