'use strict';
// TODO: Couple with log service from universal.
const logTime = (mod, req, sequence) => {
  if (sequence === 'startAt') {
    const startAt = process.hrtime();

    req.startAt = startAt;
    return;
  }
  const diff = process.hrtime(req.startAt),
    time = diff[0] * 1e3 + diff[1] * 1e-6;
  
  req.startAt = null;
  console.log(`MODULE ${mod.filename} - URL: ${req.method} ${req.path} - timeTaken: ${time.toFixed(3)}ms`);
};

module.exports = logTime;
