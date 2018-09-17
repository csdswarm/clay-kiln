'use strict'

// mount listener for vue (optional)
document.addEventListener('google-ad-manager-mount', function(event) {
    // code to run when vue mounts/updates
    console.log("page mounted")
    setAdsIDs()
})

// mount listener for vue (optional)
document.addEventListener('google-ad-manager-dismount', function(event) {
    // code to run when vue dismounts/destroys
})

const adSlotsFiltered = {
	preferred: [],
	largeLeaderboard: [],
	leaderboard: [],
	halfPage: [],
	mediumRectangle: [],
	mobile: [],
	logoSponsorship: []
}

function clearAds(){
	$(".component--google-ad-manager .google-ad-manager__slot").empty()
};

function setAdsIDs() {
	const adSlots = document.getElementsByClassName("google-ad-manager__slot")
	for (slot in adSlots) {
		if (slot.classList.contains("google-ad-manager__slot--970x250")) {
			if (window.innerWidth <= 480) {
				slot.parentElement.classList.removeClass("google-ad-manager--970x250")
				slot.parentElement.classList.addClass("google-ad-manager--320x50")
				slot.classList.removeClass("google-ad-manager__slot--970x250")
				slot.classList.addClass("google-ad-manager__slot--320x50")
				adSlotsFiltered.mobile.push(slot)
			} else if (window.innerWidth <= 1279) {
				slot.parentElement.classList.removeClass("google-ad-manager--970x250")
				slot.parentElement.classList.addClass("google-ad-manager--728x90")
				slot.classList.removeClass("google-ad-manager__slot--970x250")
				slot.classList.addClass("google-ad-manager__slot--728x90")
				adSlotsFiltered.leaderboard.push(slot)
			} else {
				adSlotsFiltered.preferred.push(slot)
			}
		} else if (slot.classList.contains("google-ad-manager__slot--970x90")) {
			adSlotsFiltered.largeLeaderboard.push(slot)
		} else if (slot.classList.contains("google-ad-manager__slot--728x90")) {
			adSlotsFiltered.leaderboard.push(slot)
		} else if (slot.classList.contains("google-ad-manager__slot--300x600")) {
			adSlotsFiltered.halfPage.push(slot)
		} else if (slot.classList.contains("google-ad-manager__slot--300x250")) {
			adSlotsFiltered.mediumRectangle.push(slot)
		} else if (slot.classList.contains("google-ad-manager__slot--320x50")) {
			adSlotsFiltered.mobile.push(slot)
		} else if (slot.classList.contains("google-ad-manager__slot--100x35")) {
			adSlotsFiltered.logoSponsorship.push(slot)
		}
	}
	console.log("all ad slots: ", adSlots)
	console.log("all ad slots filtered: ", adSlotsFiltered)
}

console.log("google ad component client.js")
function Constructor() {}
module.exports = () => new Constructor()
