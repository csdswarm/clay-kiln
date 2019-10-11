'use strict';

module.exports['1.0'] = function (uri, data) {

  if (!data.title) {
    data.title = 'Podcasts';
  }

  if (!data.showTitle) {
    data.showTitle = true;
  }

  if (!data.showCallToActions) {
    data.showCallToActions = true;
  }

  if (!data.primaryColor) {
    data.primaryColor = '';
  }

  if (!data.isTitleFontColorDark) {
    data.isTitleFontColorDark = false;
  }

  return data;
};

