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

window.freq_dfp_takeover = function(i, l, c, p) {
  var skinDiv = 'freq-dfp--bg-skin';
  var mainDiv =  document.getElementById(skinDiv);
  var skinClass = "advertisement--full";
  var adType = 'fullpageBanner';
  var width = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;

  // Include our default bg color
  if (typeof c == 'undefined') {
    c = '#FFF';
  }
  // Include our default bg position
  if (typeof p == 'undefined') {
    p = 'absolute';
  }

  // Only create div if it doesn't exist yet.
  if (!mainDiv) {
    var bgdiv = document.createElement("div");
    var cssbgtext = '';
    bgdiv.setAttribute("id", skinDiv);
    bgdiv.setAttribute("class", skinClass);
    bgdiv.setAttribute("data-ad-type", adType);
    bgdiv.style.position = p;
    bgdiv.style.height = '100%';
    bgdiv.style.width = '100%';
    bgdiv.style['z-index'] = 2;

    // If 'fixed', we need to add some scrolling treatment.
    if (p == 'fixed') {
      window.onscroll = function (e) {
        // Need browser compatibility checks.
        var supportPageOffset = window.pageXOffset !== undefined;
        var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
        var currentYscroll = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
        var stickyTop = document.getElementsByClassName('radiocom-nav')[0].clientHeight;

        if (stickyTop && currentYscroll >= stickyTop) {
          bgdiv.style.cssText = 'position: fixed; padding-top: 0px;';
        } else {
          bgdiv.style.cssText = 'position: absolute;';
        }
      };
    }

    // Does a link url exist?
    if (l) {
      // create our a tag with attributes
      var linkElem = document.createElement("a");
      linkElem.setAttribute("href", l);
      linkElem.setAttribute("target", "_new");
    }

    // Does a takeover image exist?
    if (i) {
      // TODO remove this line.
      i = 'https://images.pexels.com/photos/67636/rose-blue-flower-rose-blooms-67636.jpeg?auto=compress&cs=tinysrgb&h=350'
      var imgElem = document.createElement("div");
      cssbgtext += 'background-image: url(' + i + '); ';

      cssbgtext += 'background-position: center top; ';
      cssbgtext += 'background-repeat: no-repeat; ';
      cssbgtext += 'width:100%; ';
      imgElem.style.cssText = cssbgtext;
      imgElem.setAttribute("class", 'dfp-takeover-skin');
      imgElem.style.height = '1400px';
      if (linkElem) {
        // insert our bg image into our a tag.
        linkElem.appendChild(imgElem);
        bgdiv.appendChild(linkElem);
      } else {
        // no link so append img only.
        bgdiv.appendChild(imgElem);
      }

      var bgImg = new Image();
      bgImg.src = i;
      bgImg.onload = function () {
        // Only include background div if img is a takeover.
        // DFP seems to include a 1x1 pixel image even with no takeover.
        if (typeof bgImg.width !== 'undefined' && bgImg.width > 1) {
          // Create our wrapper div element
          mainDiv = document.getElementsByTagName("body")[0];
          mainDiv.classList.add("has-fullpage-ad");
        }
      }
    }

    // Prepend the full ad element to body.
    console.log('bgdiv', bgdiv)
    document.body.prepend(bgdiv);

    // Add a background color to '#globalWrapper' div.
    var globalDiv =  document.getElementById('vue-app-mount-point');
    if (globalDiv) {
      globalDiv.style.backgroundColor = c;
    }

    // now set top ad area to transparent
    var topAdArea = document.getElementsByClassName('advertisement--top')[0];
    if (topAdArea) {
      topAdArea.style.backgroundColor = 'transparent';
    }
  }
};
