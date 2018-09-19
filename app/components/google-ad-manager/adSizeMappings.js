const adSizes = {
	"preferred": {
		defaultSize: [970,250],
		responsiveMapping: [
			// argument 1: array of minimum screen size [w,h]
			// argument 2: array of ad slot sizes rendered in array format [[w,h],[w,h], ...]
			[[1279, 250], [970, 250]],
			[[480, 100], [728, 90]],
			[[0, 0], [[320, 100], [300, 100], [320, 50], [300, 50]]]

		]
	},
	"large-leaderboard": {
		defaultSize: [970,90],
		responsiveMapping: [
			[[1279, 90], [970, 90]],
			[[480, 90], [728, 90]],
			[[0, 0], [[320, 100], [300, 100], [320, 50], [300, 50]]]
		]
	},
	"leaderboard": {
		defaultSize: [728,90],
		responsiveMapping: [
			[[480, 100], [728, 90]],
			[[0, 0], [[320, 100], [300, 100], [320, 50], [300, 50]]]
		]
	},
	"half-page": {
		defaultSize: [300,600],
		responsiveMapping: []
	},
	"medium-rectangle": {
		defaultSize: [300,250],
		responsiveMapping: []
	},
	"mobile": {
		defaultSize: [[320, 100], [300, 100], [320, 50], [300, 50]],
		responsiveMapping: []
	},
	"logo-sponsorship": {
		defaultSize: [100,35],
		responsiveMapping: []
	}
}

module.exports.adSizes = adSizes
