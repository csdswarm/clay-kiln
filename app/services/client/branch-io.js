'use strict';

// Since the server-side service is included in an isomorphic model.js file, claycli requires that a compatible client
// service also exists.

// This is empty because we only use this function in `render`, which will never be called on the client.
module.exports.getBranchMetaTags = () => [];
