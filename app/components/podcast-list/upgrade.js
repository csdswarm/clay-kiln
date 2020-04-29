'use strict';

module.exports['1.0'] = function (uri, data) {

  data.title = 'Podcasts';
  data.primaryColor = '';
  data.showTitle = true;
  data.showCallToActions = true;
  data.isTitleFontColorDark = false;

  return data;
};

module.exports['2.0'] = function (uri, data) {

  data.backFillEnabled = true;

  return data;
};
