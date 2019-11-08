'use strict';

const _get = require('lodash/get'),
  _join = require('lodash/join'),
  _intersection = require('lodash/intersection'),
  _noop = require('lodash/noop'),
  dateFormat = require('date-fns/format'),
  differenceInCalendarDays = require('date-fns/difference_in_calendar_days'),
  circulationService = require('../../../services/universal/circulation'),
  helpers = require('./helpers'),
  warningTriggerTags = ['breaking', 'breaking news', 'feature', 'interactives'];

function getTagValues(tagsComponent) {
  if (!tagsComponent) {
    return [];
  }

  return tagsComponent.items.map(function (item) {
    return item.text.toLowerCase();
  });
}

module.exports = {
  label: 'Google Standout Available',
  description: `This article was tagged with one of the tags ${_join(warningTriggerTags, ', ')}. Ask your editor about adding the Google News Standout tag.`,
  type: 'warning',
  validate(state) {
    const articleUri = helpers.getLastComponent(state, 'article'),
      tagsUri = helpers.getLastComponent(state, 'tags'),
      tags = state.components[tagsUri],
      tagValues = getTagValues(tags),
      hasTargetTag = _intersection(tagValues, warningTriggerTags).length > 0,
      googleStandoutUri = helpers.getLastComponent(state, 'google-standout'),
      googleStandout = state.components[googleStandoutUri],
      now = new Date(),
      firstPublishTime = _get(state, 'page.state.firstPublishTime', null),
      daysSincePublish = differenceInCalendarDays(dateFormat(now), dateFormat(firstPublishTime || now));

    if (daysSincePublish < 2 && hasTargetTag && googleStandout && !googleStandout.active) {
      return circulationService.getRollingStandoutArticles(state.locals).then(function (queryResult) {
        if (queryResult.length < 7) {
          return [
            {
              uri: articleUri,
              field: 'shouldBeGoogleStandout',
              location: `${helpers.labelUtil('article')} » Mark Google Standout`
            }
          ];
        }
      }).catch(_noop);
    }
  }
};
