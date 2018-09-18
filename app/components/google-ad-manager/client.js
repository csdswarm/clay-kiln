'use strict'

const doubleclick_prefix = "21674100491"
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
			case "google-ad-manager__slot--970x250":
				if (window.innerWidth <= 480) {
					slot.parentElement.classList.remove("google-ad-manager--970x250")
					slot.parentElement.classList.add("google-ad-manager--320x50")
					slot.classList.remove("google-ad-manager__slot--970x250")
					slot.classList.add("google-ad-manager__slot--320x50")
					adSlotsFiltered.mobile.push(slot)
				} else if (window.innerWidth <= 1279) {
					slot.parentElement.classList.remove("google-ad-manager--970x250")
					slot.parentElement.classList.add("google-ad-manager--728x90")
					slot.classList.remove("google-ad-manager__slot--970x250")
					slot.classList.add("google-ad-manager__slot--728x90")
					adSlotsFiltered.leaderboard.push(slot)
				} else {
					adSlotsFiltered.preferred.push(slot)
				}
				break;
			case "google-ad-manager__slot--970x90":
				adSlotsFiltered.largeLeaderboard.push(slot)
				break;
			case "google-ad-manager__slot--728x90":
				adSlotsFiltered.leaderboard.push(slot)
				break;
			case "google-ad-manager__slot--300x600":
				adSlotsFiltered.halfPage.push(slot)
				break;
			case "google-ad-manager__slot--300x250":
				adSlotsFiltered.mediumRectangle.push(slot)
				break;
			case "google-ad-manager__slot--320x50":
				adSlotsFiltered.mobile.push(slot)
				break;
			case "google-ad-manager__slot--100x35":
				adSlotsFiltered.logoSponsorship.push(slot)
				break;
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
	let page, articleType, siteZone;
	if (document.getElementsByTagName("article").length > 0) {
		page = "article"
		articleType = document.getElementsByTagName("article")[0].getAttribute("data-article-type")
	} else {
		page = "homepage"
	}
	switch (page) {
		case "article":
			siteZone = doubleclick_prefix.concat("/","NTL.RADIO","/",articleType,"/","article")
			break
		case "homepage":
			siteZone = doubleclick_prefix.concat("/","NTL.RADIO","/","home","/","sectionfront")
			break
		case "genrePage":
			siteZone = doubleclick_prefix.concat("/","NTL.RADIO","/","categories","/","sectionfront")
			break
		case "tagPage":
			siteZone = doubleclick_prefix.concat("/","NTL.RADIO","/","tags","/","sectionfront")
			break
	}
	googletag.cmd.push(function(){
		googletag.destroySlots()
		for (let ad of adSlots) {
			let slotSizes
			switch (ad.classList[1]) {
				case "google-ad-manager__slot--970x250":
					slotSizes = [[970, 250]]
					break
				case "google-ad-manager__slot--970x90":
					slotSizes = [[970, 90]]
					break
				case "google-ad-manager__slot--728x90":
					slotSizes = [[728, 90]]
					break
				case "google-ad-manager__slot--300x600":
					slotSizes = [[300, 600]]
					break
				case "google-ad-manager__slot--300x250":
					slotSizes = [[300, 250]]
					break
				case "google-ad-manager__slot--320x50":
					slotSizes = [[320, 100], [300, 100], [320, 50], [300, 50]]
					break
				case "google-ad-manager__slot--100x35":
					slotSizes = [[100, 35]]
					break
			}
			var slot = googletag.defineSlot(
				siteZone,
				slotSizes,
				ad.id)
				if (slot) {
					slot.addService(googletag.pubads())
						.setTargeting("refresh", (refreshCount).toString())
					googleDefinedSlots.push(slot)
				}
		}
		googletag.pubads().enableSingleRequest()
		googletag.pubads().collapseEmptyDivs(true) //true = expand if ad, false = collapse if no ad. true fixes FOUC-like problem for spotlight/leaderboard at top of Station Page on init load
		googletag.pubads().setCentering(true)
		googletag.pubads().disableInitialLoad()
		googletag.enableServices()
		for (let ad of adSlots) {
			googletag.display(ad.id)
		}
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

function Constructor() {}
module.exports = () => new Constructor()
