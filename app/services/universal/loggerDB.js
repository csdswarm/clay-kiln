'use strict';
const log = require('../universal/log').setup({ file: __filename }),
  logDBTime = (mod, sequence = 'startAt', startAt = [0,0], key) => {
    if (sequence === 'startAt') {
      return  process.hrtime();
    }
    const diff = process.hrtime(startAt),
      time = diff[0] * 1e3 + diff[1] * 1e-6;

    log('info', `DATABASE ACCESS ${mod.filename} - DB ACCESS: ${key}`, { timeTaken: time.toFixed(3), key });
    return null;
  };

module.exports = logDBTime;
