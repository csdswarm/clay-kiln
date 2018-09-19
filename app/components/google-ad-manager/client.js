'use strict'
let adSizeMappings = require('./adSizeMappings')
let adSizes = adSizeMappings.adSizes
const doubleclick_prefix = "21674100491"
const doubleclick_bannerTag = "NTL.RADIO"
const doubleclick_pageTypeTag_article = "article"
const doubleclick_pageTypeTag_section = "sectionfront"
let refreshCount = 0
const adRefreshInterval = "120000" // Time in milliseconds for ad refresh
const adSlots = document.getElementsByClassName("google-ad-manager__slot")
const googleDefinedSlots = []
const adSlotsFiltered = {
	preferred: [],
	largeLeaderboard: [],
	leaderboard: [],
	halfPage: [],
	mediumRectangle: [],
	mobile: [],
	logoSponsorship: []
}

// mount listener for vue
document.addEventListener('google-ad-manager-mount', function(event) {
    // code to run when vue mounts/updates
    setAdsIDs()
})

/**
 * destroy all ads on page
 */
function clearAds(){
	for (let slot of adSlots) {
		while (slot.hasChildNodes()) {
		  slot.removeChild(slot.lastChild)
		}
	}
}

/**
 * create and add unique ids to each ad slot on page
 */
function setAdsIDs() {
	for (let slot of adSlots) {
		switch (slot.classList[1]) {
			case "google-ad-manager__slot--preferred":
				adSlotsFiltered.preferred.push(slot)
				break
			case "google-ad-manager__slot--large-leaderboard":
				adSlotsFiltered.largeLeaderboard.push(slot)
				break
			case "google-ad-manager__slot--leaderboard":
				adSlotsFiltered.leaderboard.push(slot)
				break
			case "google-ad-manager__slot--half-page":
				adSlotsFiltered.halfPage.push(slot)
				break
			case "google-ad-manager__slot--medium-rectangle":
				adSlotsFiltered.mediumRectangle.push(slot)
				break
			case "google-ad-manager__slot--mobile":
				adSlotsFiltered.mobile.push(slot)
				break
			case "google-ad-manager__slot--logo-sponsorship":
				adSlotsFiltered.logoSponsorship.push(slot)
				break
		}
	}
	for (let slotFilter in adSlotsFiltered) {
		let count = 0
		for (let slot of adSlotsFiltered[slotFilter]) {
			slot.id = slot.classList[1].concat("-", count)
			count = count + 1
		}
	}
	setAds()
}

/**
 * use ids of ad slots on page to create google ad slots and display them
 */
function setAds(){
	let page, articleType,
	siteZone = doubleclick_prefix.concat("/",doubleclick_bannerTag,"/");
	if (document.getElementsByTagName("article").length > 0) {
		page = "article"
		articleType = document.getElementsByTagName("article")[0].getAttribute("data-article-type")
	} else {
		page = "homepage"
	}
	switch (page) {
		case "article":
			siteZone = siteZone.concat(articleType,"/",doubleclick_pageTypeTag_article)
			break
		case "homepage":
			siteZone = siteZone.concat("home","/",doubleclick_pageTypeTag_section)
			break
		case "genrePage":
			siteZone = siteZone.concat("categories","/",doubleclick_pageTypeTag_section)
			break
		case "tagPage":
			siteZone = siteZone.concat("tags","/",doubleclick_pageTypeTag_section)
			break
	}
	googletag.cmd.push(function(){
		googletag.destroySlots()
		for (let ad of adSlots) {
			let slot = googletag.defineSlot(
				siteZone,
				adSizes[ad.getAttribute("data-adSize")].defaultSize,
				ad.id)
				.addService(googletag.pubads())
				.setTargeting("refresh", (refreshCount).toString())
				if (adSizes[ad.getAttribute("data-adSize")].responsiveMapping.length > 0) {
					let mapping = googletag.sizeMapping()
					for (let responsiveMap of adSizes[ad.getAttribute("data-adSize")].responsiveMapping) {
						mapping.addSize(responsiveMap[0], responsiveMap[1])
					}
					mapping.build()
					slot.defineSizeMapping(mapping)
				}
			googleDefinedSlots.push(slot)
		}
		googletag.defineSlot('/21674100491/ENT.TEST', [100, 35], 'div-gpt-ad-1532458744047-0').addService(googletag.pubads());
		googletag.pubads().enableSingleRequest()
		googletag.pubads().collapseEmptyDivs(true) //true = expand if ad, false = collapse if no ad. true fixes FOUC-like problem on init load
		googletag.pubads().setCentering(true)
		googletag.pubads().disableInitialLoad()
		googletag.enableServices()
		for (let ad of adSlots) {
			googletag.display(ad.id)
		}
		googletag.display("div-gpt-ad-1532458744047-0")
		googletag.pubads().refresh(googleDefinedSlots)
	})

	setTimeout(refreshAds, adRefreshInterval)
}

/**
 * refresh all ad slots on page every set interval in ms
 */
function refreshAds() {
	refreshCount = refreshCount + 1
	googletag.cmd.push(function(){
		for (var i in googleDefinedSlots) {
			googleDefinedSlots[i].setTargeting("refresh", (refreshCount).toString())
		}
		googletag.pubads().refresh(googleDefinedSlots)
	})
	setTimeout(refreshAds, adRefreshInterval)
}
