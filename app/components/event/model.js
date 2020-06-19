'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  createContent = require('../../services/universal/create-content'),
  moment = require('moment'),
  { autoLink } = require('../breadcrumbs');

function getFormattedDate(date, time) {
  return date && time ? moment(`${date} ${time}`).format('LLLL') : '';
}


function getSettingsConfigData() {
  const
    emptyHtml = '<span class="component-settings__property-data-empty">None</span>';

  return {
    settingsTitle: 'Event Circulation',
    classModifier: '--event-settings',
    sections: [
      {
        dataEditable: 'circulationHeadlinesSeoGroup',
        sectionTitle: 'Headlines, Teasers, and SEO',
        settings: [
          {
            title: 'Facebook Headline',
            isRequired: true,
            templateString: `{{{ default primaryHeadline '${emptyHtml}' }}}`
          },
          {
            title: 'Twitter/Short Headline',
            isRequired: true,
            templateString: `{{{ default shortHeadline '${emptyHtml}' }}}`
          },
          {
            title: 'Teaser',
            isRequired: true,
            templateString: `{{{ default teaser '${emptyHtml}' }}}`
          },
          {
            title: 'SEO Headline',
            isRequired: true,
            templateString: `{{{ default seoHeadline '${emptyHtml}' }}}`
          },
          {
            title: 'SEO Description',
            isRequired: true,
            templateString: `{{{ default seoDescription '${emptyHtml}' }}}`
          }
        ]
      },
      {
        dataEditable: 'circulationSyndicationGroup',
        sectionTitle: 'Syndication',
        settings: [
          {
            title: 'Featured',
            isRequired: false,
            templateString: '{{ if featured "Yes" else="No" }}'
          },
          {
            title: 'Editorial Feeds Term(s)',
            isRequired: false,
            templateString: `{{{ default (commaSeparated editorialFeeds false) '${emptyHtml}' }}}`
          },
          {
            title: 'Syndicate to Corporate Website(s)',
            isRequired: false,
            templateString: `{{{ default (commaSeparated corporateSyndication false) '${emptyHtml}' }}}`
          },
          {
            title: 'Syndicate to Station(s)',
            isRequired: false,
            templateString: `{{{ default (join stationSyndication) '${emptyHtml}' }}}`
          },
          {
            title: 'Syndicate to Genre(s)',
            isRequired: false,
            templateString: `{{{ default (join genreSyndication) '${emptyHtml}' }}}`
          },
          {
            title: 'Syndication Status',
            isRequired: false,
            templateString: `{{{ default syndicationStatus '${emptyHtml}' }}}`
          },
          {
            title: 'Syndicated URL',
            isRequired: false,
            templateString: `{{{ default syndicatedUrl '${emptyHtml}' }}}`
          }
        ]
      },
      {
        dataEditable: 'circulationSlugGroup',
        sectionTitle: 'Slug and URL',
        settings: [
          {
            title: 'Event Slug',
            isRequired: true,
            templateString: `{{{ default slug '${emptyHtml}' }}}`
          },
          {
            title: 'Evergreen Treatment',
            isRequired: false,
            templateString: '{{ if evergreenSlug "Yes" else="No" }}'
          }
        ]
      },
      {
        dataEditable: 'circulationFeedsGroup',
        sectionTitle: 'Recirculation',
        settings: [
          {
            title: 'Recirculation Image',
            isRequired: true,
            templateString: `
              {{#if feedImgUrl}}
                <img class="component-settings__property-data-feed-img" src="{{ feedImgUrl }}?width=300" alt="" />
              {{else}}
                <div class="component-settings__property-data-feed-img-empty">None</div>
              {{/if}}
            `
          }
        ]
      }
    ]
  };
}

module.exports = unityComponent({

  save: (ref, data, locals) => {
    data.dateModified = (new Date()).toISOString();
    return createContent.save(ref, data, locals);
  },

  render: async (ref, data, locals) => {
    data._computed.dateTime = getFormattedDate(data.startDate, data.startTime);
    data._computed.eventCirculationSettings = getSettingsConfigData();
    await autoLink(data, [
      { slug: 'events', text: 'events' }
    ], locals);
    return createContent.render(ref, data, locals);
  }

});
