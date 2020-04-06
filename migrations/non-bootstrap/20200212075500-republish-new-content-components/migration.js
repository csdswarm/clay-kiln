'use strict';

const { v1: { 
        _flatMap, 
        clayutils: { isPublished } 
    } } = require('../../legacy/migration-utils'),
    { v1: { fromMainComponent, fromPageHeaderComponent } } = require('../../utils/get-page-uris'),
    { v1: parseHost } = require('../../utils/parse-host'),
    { v1: republishPageUris } = require('../utils/republish-page-uris'),
    host = process.argv[2] || 'clay.radio.com',
    envInfo = parseHost(host);

Promise.all([
        fromPageHeaderComponent('author-page-header'), 
        fromPageHeaderComponent('topic-page-header'), 
        fromMainComponent('static-page'),
        fromMainComponent('event'),
        fromMainComponent('contest')])
    .then(result => _flatMap(result))
    .then(uris => uris.filter(isPublished))
    .then(pageUris => republishPageUris(pageUris, envInfo));