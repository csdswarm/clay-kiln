'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  moment = require('moment');

function getComputedEvents(events) {
  return events.map( event => {
    return {
      ...event,
      dateTime: moment(`${event.startDate} ${event.startTime}`).format('LLLL')
    };
  });
}

module.exports = unityComponent({
  save: (_ref, data) => data,
  render: (_ref, data) => {
    // data.events = getEvents(); // obviously not needed when integrated
    // but this will be because of some computed props for the view
    data._computed = {
      events: getComputedEvents(data.events)
    };
    return data;
  }
});
