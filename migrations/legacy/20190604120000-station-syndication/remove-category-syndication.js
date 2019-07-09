'use strict';

const mappingJSON = process.argv.slice(2)[0],
  settingJSON = process.argv.slice(3)[0];

if (!mappingJSON || !settingJSON) {
  console.log(process.argv);
  throw new Error('Missing arguments!');
}
const mapping = JSON.parse(mappingJSON);
const mapKey = Object.keys(mapping)[0];
const settings = JSON.parse(settingJSON);
const settingsKey = Object.keys(settings)[0];

const newSettings = {
  settings: {
    analysis: settings[settingsKey].settings.index.analysis
  }
};
delete mapping[mapKey].mappings._doc.properties.categorySyndication;

const payload = JSON.stringify({
  ...newSettings,
  ...mapping[mapKey]
});

console.log(payload);
