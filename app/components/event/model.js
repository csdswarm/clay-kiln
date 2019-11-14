'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  // createContent = require('../../services/universal/create-content'),
  moment = require('moment'),
  { autoLink } = require('../breadcrumbs');

function getFormattedDate(date, time) {
  return date && time ? moment(`${date} ${time}`).format('LLLL') : '';
}


function getSettingsConfigData() {
  const emptyHtml = '<span class="circulation--empty">None</span>';

  return {
    settingsTitle: 'Event Circulation!!!!!',
    classModifier: '--event-settings',
    sections: [
      {
        dataEditable: 'fooData',
        sectionTitle: 'Section 1',
        settings: [
          {
            title: 'Setting 1',
            isRequired: true,
            templateString: 'Straight Text!'
          },
          {
            title: 'Setting 2',
            isRequired: false,
            templateString: `{{{ default startDate '${emptyHtml}' }}}`
          }
        ]
      }
    ]
  };
}

module.exports = unityComponent({

  save: (ref, data) => {
    // NOTE: may need to return createContent.render(uri, data, locals);
    return data;
  },

  render: (ref, data, locals) => {
    data._computed.dateTime = getFormattedDate(data.startDate, data.startTime);
    data._computed.eventCirculationSettings = getSettingsConfigData();
    // NOTE: figure out what is needed here
    autoLink(data, ['stationSlug', '{events}'], locals.site.host);
    // NOTE: may need to return createContent.render(uri, data, locals);
    return data;
  }

});
