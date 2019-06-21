'use strict';

const newAnalyzer = {
  "station_analyzer": {
    "filter": [
      "standard",
      "my_ascii_folding",
      "lowercase"
    ],
    "char_filter": [
      "remove_whitespace",
      "remove_punctuation"
    ],
    "tokenizer": "standard"
  }
}
const newProps = {
  stationSyndication: {
    type: "keyword",
    "fields": {
      "normalized": {
        "type": "text",
        "analyzer": "station_analyzer"
      }
    }
  },
  categorySyndication: {
    type: "keyword",
    "fields": {
      "normalized": {
        "type": "text",
        "analyzer": "station_analyzer"
      }
    }
  },
  genreSyndication: {
    type: "keyword",
    "fields": {
      "normalized": {
        "type": "text",
        "analyzer": "station_analyzer"
      }
   }
  }
};
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

settings[settingsKey].settings.index.analysis.analyzer = {
  ...settings[settingsKey].settings.index.analysis.analyzer,
  ...newAnalyzer
};
const newSettings = {
  settings: {
    analysis: settings[settingsKey].settings.index.analysis
  }
};
mapping[mapKey].mappings._doc.properties = {
  ...mapping[mapKey].mappings._doc.properties,
  ...newProps      
};
const payload = JSON.stringify({
  ...newSettings,
  ...mapping[mapKey]
});

console.log(payload);
