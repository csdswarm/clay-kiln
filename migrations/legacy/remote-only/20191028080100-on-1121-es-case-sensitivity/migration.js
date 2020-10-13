const {
  v1: {
    _has,
    _set,
    elasticsearch: { updateIndex },
    parseHost,
  }
} = require('../../utils/migration-utils');

const hostInfo = parseHost(process.argv[2]);
const index = 'published-content';
const path = {
  toSecondarySectionFrontFields: '_doc.properties.secondarySectionFront.fields.normalized',
  toFlexAnalyzer: 'analysis.analyzer.flex_analyzer'
};

// This is, so far, the exact same as the station, author and tag_analyzer's
// I'm giving it the name flex to be a bit more generic so that we don't need to
// keep adding the same exact analyzer to normalize new fields. I expect we may eventually
// switch the other fields to use this analyzer and ditch the more specifically named ones
// until such time as they deviate from this one. - CSD
const flex_analyzer = {
  filter: ['standard', 'my_ascii_folding', 'lowercase'],
  char_filter: ['remove_whitespace', 'remove_punctuation'],
  tokenizer: 'standard',
};

const normalized = {
  type: 'text',
  analyzer: 'flex_analyzer',
};

const doesNotCurrentlyHaveTheMapping = mappings => !_has(mappings, path.toSecondarySectionFrontFields);
const addFlexibleAnalyzer = settings => _set({ ...settings }, path.toFlexAnalyzer, flex_analyzer);
const addFlexAnalyzerToTarget = mappings => _set({ ...mappings }, path.toSecondarySectionFrontFields, normalized);

async function start() {
  console.log('Adding normalization for secondarySectionFront index to make it more flexible for matches.');
  const updated = await updateIndex(
    hostInfo,
    index,
    {
      shouldUpdate: doesNotCurrentlyHaveTheMapping,
      updateMappings: addFlexAnalyzerToTarget,
      updateSettings: addFlexibleAnalyzer,
    }
  );

  if (updated) {
    console.log(`Created flexible match analyzer for secondarySectionFront in the ${updated} index`);
  } else {
    console.log(`Flexible match analyzer for secondarySectionFront in the ${index} index already exists. Skipping.`);
  }
}

start()
  .catch(console.error);
