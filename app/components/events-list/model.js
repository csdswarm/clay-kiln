'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  moment = require('moment');

// function pad(num) {
//   if (num <= 9) {
//     num = '0' + num;
//   }
//   return num;
// }

// function getEvents() {
//   return Array(5)
//     .fill('')
//     .map((el, i) => {
//       return {
//         feedImgUrl: `https://via.placeholder.com/960x540?text=event thumb ${i + 1}`,
//         headline: `The Awesome Event #${i + 1}`,
//         label: 'Featured Event',
//         startDate: `2019-12-${pad(i + 1)}`,
//         startTime: `09:${pad(i + 1)}`,
//         teaser: 'this is a teaser',
//         venueName: `The Coolest Venue Place #${pad(i + 1)}`
//       };
//     });
// }

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
