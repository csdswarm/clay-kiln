'use strict';

/**
 * Add classes to document body when edit mode is triggered on template or layout
 *
 * @param {object} kilnInput
 */
module.exports = kilnInput => {
  kilnInput.subscribe('ADD_ALERT', async payload => {
    const TEMPLATE_EDIT_WARNING = 'Changes you make will be reflected on new pages that use this template.';

    if (payload.text.includes(TEMPLATE_EDIT_WARNING)) {
      document.querySelector('.kiln-edit-mode').classList.add('kiln-edit-mode--template');
    }
  }, false);

  kilnInput.subscribe('TOGGLE_EDIT_MODE', async payload => {
    const bodyEl = document.querySelector('.kiln-edit-mode');

    bodyEl.classList.remove('kiln-edit-mode--layout', 'kiln-edit-mode--page');
    bodyEl.classList.add(`kiln-edit-mode--${ payload }`);
  }, false);
};
