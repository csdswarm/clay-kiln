'use strict';

module.exports.save = (ref, data) => {
  data.displayTitle = data.displayTitle.trim() || 'Presented by';
  return data;
};

module.exports.render = (ref, data) => {
  return data;
};
