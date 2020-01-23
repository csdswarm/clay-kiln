'use strict';

const { kilnInput: KilnInput } = window.kiln,
  _isObjectLike = require('lodash/isObjectLike'),
  /**
   * LIMITATIONS: does not work for multiline
   * components in complex lists
   */
  { normalizeEmptyMultiLineContent } = require('./normalize-empty-multiline-content'),
  /**
   * @param {Object} schemaObject
   * @return {Bool}
   */
  isMultiLineWysiwyg = ([, config]) => {
    if (!_isObjectLike(config)) {
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
      normalizeEmptyMultiLineContent(
        multiLineFieldNames,
        kilnInput
      )
    );

    return schema;
  };

module.exports = {
  watchMultiLineComponentChanges
};
