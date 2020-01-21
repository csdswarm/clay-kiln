'use strict';

const { kilnInput: KilnInput } = window.kiln,
  normalizeEmptyMultiLine = require('./normalize-empty-multiline'),
  /**
   * @param {Object} schemaObject
   * @return {Bool}
   */
  isMultiLineWysiwyg = ([, config]) => {
    if (typeof config === null || typeof config !== 'object') {
      return false;
    }
    const { _has = {} } = config,
      { input = '', type = '' } = _has;

    return input === 'wysiwyg' && type === 'multi-line';
  },
  /**
   * Watches for changes on multiline components
   * and triggers side effects as needed.
   *
   * @param {Object} schema kiln schema
   * @return {Object} schema
   */
  watchMultiLineComponentChanges = (schema) => {
    const multiLineFieldNames = new Set(
        Object.entries(schema)
          .filter(isMultiLineWysiwyg)
          .map(([name]) => name)
      ),
      kilnInput = new KilnInput(schema);

    kilnInput.subscribe(
      'UPDATE_COMPONENT',
      normalizeEmptyMultiLine(
        multiLineFieldNames,
        kilnInput
      )
    );

    return schema;
  };

module.exports = watchMultiLineComponentChanges;
