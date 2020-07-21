'use strict';
const log = require('./log').setup({ file: __filename }),
  logTime = (mod, req, sequence = 'startAt') => {
    if (sequence === 'startAt') {
      const startAt = process.hrtime();
      
      req.startAt = startAt;
      return;
    }
    const diff = process.hrtime(req.startAt),
      timeInMilliseconds = diff[0] * 1e3 + diff[1] * 1e-6;
    
    req.startAt = null;
    log('info', `MODULE ${mod.filename} - URL: ${req.method} ${req.path}`, { timeTaken: timeInMilliseconds.toFixed(3) });
  };

module.exports = logTime;
