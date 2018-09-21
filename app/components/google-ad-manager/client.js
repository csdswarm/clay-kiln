'use strict';

let adMapping = require('./adMapping'),
  adSizes = adMapping.adSizes,
  refreshCount = 0;
const doubleclickPrefix = '21674100491',
  doubleclickBannerTag = 'NTL.RADIO',
  doubleclickPageTypeTagArticle = 'article',
  doubleclickPageTypeTagSection = 'sectionfront',
  adRefreshInterval = '120000', // Time in milliseconds for ad refresh
  adSlots = document.getElementsByClassName('google-ad-manager__slot'),
  googleDefinedSlots = [];

// On page load set up sizeMappings
adMapping.setupSizeMapping();

// mount listener for vue
document.addEventListener('google-ad-manager-mount', function () {
  // code to run when vue mounts/updates
  setAdsIDs();
});
document.addEventListener('google-ad-manager-dismount', function () {
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
  let page, articleType,
    siteZone = doubleclickPrefix.concat('/',doubleclickBannerTag,'/');

  if (document.getElementsByTagName('article').length > 0) {
    page = 'article';
    articleType = document.getElementsByTagName('article')[0].getAttribute('data-article-type');
  } else {
    page = 'homepage';
  }
  switch (page) {
    case 'article':
      siteZone = siteZone.concat(articleType,'/',doubleclickPageTypeTagArticle);
      break;
    case 'homepage':
      siteZone = siteZone.concat('home','/',doubleclickPageTypeTagSection);
      break;
    case 'genrePage':
      siteZone = siteZone.concat('categories','/',doubleclickPageTypeTagSection);
      break;
    case 'tagPage':
      siteZone = siteZone.concat('tags','/',doubleclickPageTypeTagSection);
      break;
    default:
  }
  googletag.cmd.push(function () {
    for (let ad of adSlots) {
      let adSize = ad.getAttribute('data-adSize'),
        sizeMapping = adMapping.sizeMapping[adSize],
        slot = googletag.defineSlot(
          siteZone,
          [adSizes[adSize].defaultSize],
          ad.id
        )
          .defineSizeMapping(sizeMapping)
          .addService(googletag.pubads())
          .setCollapseEmptyDiv(true)
          .setTargeting('refresh', refreshCount.toString());

      googleDefinedSlots.push(slot);
      googletag.display(ad.id);
    }
    googletag.defineSlot('/21674100491/ENT.TEST', [100, 35], 'div-gpt-ad-1532458744047-0').addService(googletag.pubads());
    googletag.display('div-gpt-ad-1532458744047-0');
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
