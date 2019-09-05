'use strict';

const BrightcoveVideo = require('../../global/js/classes/BrightcoveVideo');

class Brightcove extends BrightcoveVideo {}

module.exports = el => new Brightcove(el);
