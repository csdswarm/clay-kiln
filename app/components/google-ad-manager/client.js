'use strict';

let adMapping = require('./adMapping'),
  adSizes = adMapping.adSizes,
  refreshCount = 0;
const doubleclickPrefix = '21674100491',
  doubleclickBannerTag = 'NTL.RADIO',
  rightRailAdSizes = ['medium-rectangle', 'half-page'],
  doubleclickPageTypeTagArticle = 'article',
  doubleclickPageTypeTagSection = 'sectionfront',
  adRefreshInterval = '120000', // Time in milliseconds for ad refresh
  adSlots = document.getElementsByClassName('google-ad-manager__slot');

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
      const adSize = ad.getAttribute('data-adSize'),
        pubAds = googletag.pubads();
      let slot,
        sizeMapping = adMapping.sizeMapping[adSize];

      if (adSize == 'outOfPage') {
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
        .addService(pubAds)
        .setCollapseEmptyDiv(true);

      slot.setTargeting('refresh', refreshCount.toString());

      if (rightRailAdSizes.includes(adSize)) {
        slot.setTargeting('rightRail', true);
      }
      googletag.display(ad.id);
    }
    googletag.pubads().refresh();
  });

  googletag.pubads().addEventListener('impressionViewable', function (event) {
    const { slot } = event,
      [ refresh ] = slot.getTargeting('refresh'),
      [ rightRail ] = slot.getTargeting('rightRail');

    if (refresh && rightRail) {
      slot.setTargeting('refresh', (parseInt(refresh) + 1).toString());
      setTimeout(function () {
        googletag.pubads().refresh([slot]);
      }, adRefreshInterval);
    }
  });
}

function freq_dfp_takeover() {
  console.log('TODO implement freq dfp takeover')
}
