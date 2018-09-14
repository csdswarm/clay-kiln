// mount listener for vue (optional)
document.addEventListener('example-comp-mount', function(event) {
    // code to run when vue mounts/updates
    console.log("page mounted")
    setAdsIDs()
});

console.log("google ad slot client.js")

// mount listener for vue (optional)
document.addEventListener('example-comp-dismount', function(event) {
    // code to run when vue dismounts/destroys
});

let stationFavorites;
let adInterval = null;
let adRefreshInterval = adRefreshInterval; // Time in milliseconds for ad refresh
let refreshCount = 0;
let tags = [];
let slots = [];
let slotsLoc = [];
let resetMargins;
let adsOn = adsOn;

function clearAds(){
	$(".component--google-ad-manager-slot").empty();
};

function setAdsIDs() {
	const adSlots = document.getElementsByClassName("component--google-ad-manager-slot");
	console.log(adSlots);
}

function setAds(doubleclick_prefix) {
	if (this.adsOn) {
		this.refreshCount = 0;
		this.tags = tags;
		this.slots.length = 0;
		this.clearAds();
		$(".banner").not(".companion").addClass("active");

		var doubleclick_bannertag,
			random = Math.floor(Math.random() * 100),
			siteZone,
			temp_tags = [],
			temp_leaderboard_ids = {},
			temp_spotlight_ids = {},
			temp_display_ids = {},
			adsLeaderboard = $(".leaderboard"),
			adSpotlight = $(".spotlight"),
			adDisplay = $(".display");


		adSpotlight.each(function(ad) {
			temp_spotlight_ids[".spotlight-" + ad] = "spotlight-" + ad + random.toString();
			$(this).append('<div id=' + temp_spotlight_ids[".spotlight-" + ad] + '></div>');
		});
		adDisplay.each(function(ad) {
			temp_display_ids[".display-" + ad] = "display-" + ad + random.toString();
			$(this).append('<div id=' + temp_display_ids[".display-" + ad] + '></div>');
		});
		adsLeaderboard.each(function(ad) {
			temp_leaderboard_ids[".leaderboard-" + ad] = "leaderboard-" + ad + random.toString();
			$(this).append('<div id=' + temp_leaderboard_ids[".leaderboard-" + ad] + '></div>');
		});

		if (doubleclick_banner_id) {
			doubleclick_bannertag = doubleclick_banner_id ? doubleclick_banner_id : 'NTL.RADIO';
			siteZone = doubleclick_prefix + doubleclick_bannertag + '/livestreamplayer';
		} else if (station !== null && station.adtracking) {
			doubleclick_bannertag = station.adtracking.doubleclick_bannertag ? station.adtracking.doubleclick_bannertag : 'NTL.RADIO';
			siteZone = doubleclick_prefix + doubleclick_bannertag + '/livestreamplayer';
		} else {
			siteZone = doubleclick_prefix + 'NTL.RADIO/livestreamplayer';
		}

		googletag.cmd.push(function() {
		  googletag.defineSlot('/21674100491/ENT.TEST', [100, 35], 'div-gpt-ad-1532458744047-0').addService(googletag.pubads());
		  googletag.pubads().enableSingleRequest();
		  googletag.enableServices();
		});

		googletag.cmd.push(function(){
			googletag.destroySlots();
			adSpotlight.each(function(ad) {
				var slot = googletag.defineSlot(
					siteZone,
					[[970, 250],[728, 90],[970,66]],
					temp_spotlight_ids[".spotlight-" + ad]);
					if (slot) {
						slot.addService(googletag.pubads())
							.setTargeting("pos", "top")
							.setTargeting("loc", "atf")
							.setTargeting("market", this.tags.market.toLowerCase().replace(/ /g, ""))
							.setTargeting("station", this.tags.callsign.toLowerCase().replace(/ /g, ""))
							.setTargeting("genre", this.tags.genre[0].toLowerCase().replace(/ /g, ""))
							.setTargeting("refresh", (this.refreshCount).toString().replace(/ /g, ""))
							.setTargeting("tag", this.tags.extra[0].toLowerCase().replace(/ /g, ""));
						if (this.tags.extra[1]) {
							googletag.pubads().setTargeting("tag", this.tags.extra[1].toLowerCase().replace(/ /g, ""));
						}
						this.slots.push(slot);
					}
				this.slotsLoc.push("top");
			}.bind(this));

			adDisplay.each(function(ad) {
				var slot = googletag.defineSlot(
					siteZone,
					[[300, 250], [300, 600]],
					temp_display_ids[".display-" + ad]);
					if (slot) {
						slot.addService(googletag.pubads())
							.setTargeting("pos", "rec1")
							.setTargeting("market", this.tags.market.toLowerCase().replace(/ /g, ""))
							.setTargeting("station", this.tags.callsign.toLowerCase().replace(/ /g, ""))
							.setTargeting("genre", this.tags.genre[0].toLowerCase().replace(/ /g, ""))
							.setTargeting("refresh", (this.refreshCount).toString().replace(/ /g, ""))
							.setTargeting("tag", this.tags.extra[0].toLowerCase().replace(/ /g, ""));
						if (this.tags.extra[1]) {
							googletag.pubads().setTargeting("tag", this.tags.extra[1].toLowerCase().replace(/ /g, ""));
						}
						this.slots.push(slot);
					}
				this.slotsLoc.push("top");
			}.bind(this));

			adsLeaderboard.each(function(ad) {
				var slot = googletag.defineSlot(
					siteZone,
					[[728, 90]],
					temp_leaderboard_ids[".leaderboard-" + ad]);
					if (slot) {
						slot.addService(googletag.pubads())
							.setTargeting("pos", "bottom")
							.setTargeting("loc", "btf")
							.setTargeting("market", this.tags.market.toLowerCase().replace(/ /g, ""))
							.setTargeting("station", this.tags.callsign.toLowerCase().replace(/ /g, ""))
							.setTargeting("genre", this.tags.genre[0].toLowerCase().replace(/ /g, ""))
							.setTargeting("refresh", (this.refreshCount).toString().replace(/ /g, ""))
							.setTargeting("tag", this.tags.extra[0].toLowerCase().replace(/ /g, ""));
						if (this.tags.extra[1]) {
							googletag.pubads().setTargeting("tag", this.tags.extra[1].toLowerCase().replace(/ /g, ""));
						}
						this.slots.push(slot);
					}
				this.slotsLoc.push("bottom");
			}.bind(this));

			googletag.pubads().enableSingleRequest();
			googletag.pubads().collapseEmptyDivs(true); //true = expand if ad, false = collapse if no ad. true fixes FOUC-like problem for spotlight/leaderboard at top of Station Page on init load
			googletag.pubads().setCentering(true);
			googletag.pubads().disableInitialLoad();
			googletag.enableServices();

			adSpotlight.each(function(ad) {
				googletag.display(temp_spotlight_ids[".spotlight-" + ad]);
			});
			adDisplay.each(function(ad) {
				googletag.display(temp_display_ids[".display-" + ad]);
			});
			adsLeaderboard.each(function(ad) {
				googletag.display(temp_leaderboard_ids[".leaderboard-" + ad]);
			});

			googletag.pubads().refresh(this.slots);
		}.bind(this));

		this.refreshInterval();
		setTimeout(function() { this.resetMarginsForEmptyAds() }.bind(this), 3000);
	}
};

function triggerAds(location) {
	if (location == "directory") {
		this.setAds(
			doubleclick_prefix,
			null,
			{
				extra: ['page','stationdirectory'],
				callsign: "N/A",
				market: "national",
				genre: ["N/A"]
			}
			);
	} else {
		if (this.stationObject.stationOnPage["slug"]) {
			this.setAds(
				doubleclick_prefix,
				this.stationObject.stationOnPage,
				this.stationObject.getTags(['livestreamplayer']));
		} else {
			setTimeout(function(){ this.triggerAds() }.bind(this), 500);
		}
	}
}

function resetMarginsForEmptyAds() {
	clearTimeout(this.resetMargins);
	$(".banner>div").each(function() {
		if ($(this).css("display") == "none" || $(this).is(":empty")) {
			$(this).parent().removeClass("active");
		} else {
			$(this).parent().addClass("active");
		}
	});
	this.resetMargins = setTimeout(function() { this.resetMarginsForEmptyAds() }.bind(this), 5000); //incase network is exeptionally slow
}

function clearInterval() {
	if (this.adInterval) {
		clearInterval(this.adInterval);
		this.adInterval = null;
	}
};

function refreshAds(once) {
	if (!once) {
		this.refreshInterval();
	}
	setTimeout(function() { this.resetMarginsForEmptyAds() }.bind(this), 5000);

	this.refreshCount++;
	googletag.cmd.push(function(){
		for (var i in this.slots) {
			this.slots[i].setTargeting("refresh", (this.refreshCount).toString().replace(/ /g, ""));
		}
		googletag.pubads().refresh(this.slots);
	}.bind(this));
};

function refreshInterval() {
	if (this.adRefreshInterval) {
		// Refreshes the timer
		this.clearInterval();
		this.adInterval = setTimeout(function (){
			this.refreshAds();
		}.bind(this), this.adRefreshInterval);
	}
};
