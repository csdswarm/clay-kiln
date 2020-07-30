const fs = require('fs'),
  host = process.argv.slice(2)[0],
  instance = process.argv.slice(2)[1],
  layoutJSON = {};

if (!host || !instance) {
  throw new Error('Missing host or instance name');
}

layoutJSON.top = [
  { _ref: `${ host }/_components/top-nav/instances/default` },
  { _ref: `${ host }/_components/theme/instances/default` },
  { _ref: `${ host }/_components/station-nav/instances/default` },
  { _ref: `${ host }/_components/google-ad-manager/instances/globalLogoSponsorship` }
];
layoutJSON.head = 'head';
layoutJSON.main = 'main';
layoutJSON.bottom = [
  { _ref: `${ host }/_components/yieldmo/instances/default` },
  { _ref: `${ host }/_components/google-ad-manager/instances/billboardBottom` },
  { _ref: `${ host }/_components/google-ad-manager/instances/mobileAdhesion` },
  { _ref: `${ host }/_components/google-ad-manager/instances/mobileInterstitial` },
  { _ref: `${ host }/_components/station-footer/instances/default` },
  { _ref: `${ host }/_components/footer/instances/default` },
  { _ref: `${ host }/_components/nielsen/instances/default` }
];
layoutJSON.static = [
  { _ref: `${ host }/_components/web-player/instances/default` },
  { _ref: `${ host }/_components/chartbeat/instances/default` }
];
layoutJSON.tertiary = 'tertiary';
layoutJSON.secondary = 'secondary';
layoutJSON.headLayout = [
  { _ref: `${ host }/_components/favicon/instances/default` },
  { _ref: `${ host }/_components/google-ad-manager-head/instances/default` },
  { _ref: `${ host }/_components/comscore-head/instances/default` },
  { _ref: `${ host }/_components/google-tag-manager/instances/default` }
];
layoutJSON.pageHeader = 'pageHeader';
layoutJSON.layoutHeader = 'layoutHeader';
layoutJSON.kilnInternals = [
  { _ref: `${ host }/_components/clay-kiln/instances/general` }
];
layoutJSON.sectionHeader = 'sectionHeader';

fs.writeFile(`${ __dirname }/${ instance }-layout.json`,
  JSON.stringify(layoutJSON), 'utf8', function(err) {
    if (err) throw err;
  }
);
