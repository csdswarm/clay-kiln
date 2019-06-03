'use strict';

const _random = require('lodash/random'),
  _sum = require('lodash/sum'),
  abTest = (percentages = [50, 50], labels = [true, false]) => {
    let total = 0;
    const randInt = _random(0, _sum(percentages)),
      labelIndex = percentages.findIndex(percent => {
        total += percent;
        return randInt < total;
      });
   
    return labels[labelIndex];
  };

module.exports = abTest;
