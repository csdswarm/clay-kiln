'use strict';

const getStationsSubscribedToContent = async () => {
  return [
    {
      callsign: 'WRXRFM',
      name: 'Rock 105',
      site_slug: 'rock105'
    },
    {
      callsign: 'WXRTFM',
      name: '93XRT',
      site_slug: 'wxrt'
    },
    {
      callsign: 'WNCXFM',
      name: '98.5 WNCX',
      site_slug: 'wncx'
    }
  ];
};

module.exports = getStationsSubscribedToContent;
