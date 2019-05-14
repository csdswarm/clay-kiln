'use strict';

module.exports = () => {
    window.kiln = window.kiln || {};
    window.kiln.toolbarButtons = window.kiln.toolbarButtons || {};
    window.kiln.toolbarButtons['subscribe'] = require('./subscribe-button.vue');
};