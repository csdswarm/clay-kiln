'use strict';

const { parseHost } = require('../migration-utils').v1;

async function createElasticsearchIndex(host) {
  const { es } = parseHost(host);


}
