'use strict';

const BrightcoveVideo = require('../../global/js/classes/BrightcoveVideo');

class BrightcoveLive extends BrightcoveVideo {}

module.exports = el => new BrightcoveLive(el);
