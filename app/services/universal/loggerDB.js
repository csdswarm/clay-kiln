'use strict';
// TODO: Couple with log service from universal.
const logDBTime = (mod, sequence = 'startAt', startAt = [0,0], key) => {
  if (sequence === 'startAt') {
    return  process.hrtime();
  }
  const diff = process.hrtime(startAt),
    time = diff[0] * 1e3 + diff[1] * 1e-6;

  console.log(`DB ACCESS - MODULE ${mod.filename} - ${key} - timeTaken: ${time.toFixed(3)}ms`);
  return null;
};

module.exports = logDBTime;
