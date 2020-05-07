'use strict';

const ioredis = require('ioredis');

module.exports = new ioredis(process.env.REDIS_HOST);
