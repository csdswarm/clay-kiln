'use strict';

const
  /**
   * Determines if the content is empty based on
   * the `textContent` of the html
   *
   * @param {String} htmlContent
   * @return {Bool}
   */
  isEmptyContent = (htmlContent = '') => {
    const tempDiv = document.createElement('div');

    tempDiv.innerHTML = htmlContent;
    return !tempDiv.textContent.length;
  },
  /**
   * Fixes an issue with multiline output where an extra
   * `<br />` element gets added upon clearing the field
   * which prevents the kiln placeholder from appearing.
   *
   * To fix this, we reset the empty field back to an empty string.
   *
   * @param {Set} multiLineFieldNames
   * @param {Object} kilnInput
   * @return {Function} kiln input subscription
   */
  normalizeEmptyMultiLineContent = (
    multiLineFieldNames,
    kilnInput
  ) => (payload = {}) => {
    const {
        uri = '',
        data = {},
        fields = []
      } = payload,
      isEmptyMultiLine = (name = '') =>
        multiLineFieldNames.has(name) &&
          isEmptyContent(data[name]),
      resetEmptyField = (name = '') => {
        data[name] = '';
      },
      emptyFields = fields.filter(isEmptyMultiLine),
      shouldSaveAndRerender = emptyFields.length > 0;

    emptyFields.forEach(resetEmptyField);

    if (shouldSaveAndRerender) {
      kilnInput.saveComponent(uri, data);
    }
  };

module.exports = { normalizeEmptyMultiLineContent };
