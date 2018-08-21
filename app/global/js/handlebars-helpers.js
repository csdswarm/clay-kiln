// This file re-creates the Kiln object in the reader facing pages.
// It's used to mount the handlebar helpers to the window
// @TODO: Remove once solution is found for import/export vs require bug in webpack
window.kiln = window.kiln || {};
window.kiln.helpers = require('../../services/universal/helpers');;