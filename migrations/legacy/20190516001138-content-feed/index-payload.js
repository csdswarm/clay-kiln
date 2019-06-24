'use strict';

const newProp = {
  byline: {
    type: "nested",
    dynamic: "true"
  }
};
const mappingJSON = process.argv.slice(2)[0],
  settingJSON = process.argv.slice(3)[0];

if (!mappingJSON || !settingJSON) {
  console.log(process.argv);
  throw new Error('Missing arguments!');
}
const mapping = JSON.parse(mappingJSON);
const key = Object.keys(mapping)[0];
const settings = JSON.parse(settingJSON);
const newSettings = {
  settings: {
    analysis: settings[Object.keys(settings)[0]].settings.index.analysis
  }
};
mapping[key].mappings._doc.properties = {
  ...mapping[key].mappings._doc.properties,
  ...newProp
};

const payload = JSON.stringify({
  ...newSettings,
  ...mapping[key]
});

console.log(payload);
