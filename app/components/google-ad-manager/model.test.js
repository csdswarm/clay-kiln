'use strict';

const { expect } = require('chai'),
  { render } = require('./model');

describe('google-ad-manager/model.js', () => {
  it('defaults renderGAM to true', () => {
    const data = render('some uri', { _computed: {} }, getLocals());

    expect(data).to.nested.include({ '_computed.renderGAM': true });
  });

  it('disables global sponsorships', () => {
    const data = render(
      'some uri',
      {
        _computed: {},
        adSize: 'global-logo-sponsorship'
      },
      getLocals({ stationOptions: { isGlobalSponsorshipEnabled: false } })
    );

    expect(data).to.nested.include({ '_computed.renderGAM': false });
  });
});

function getLocals(override) {
  return Object.assign(
    {},
    {
      station: {},
      stationOptions: {}
    },
    override
  );
}
