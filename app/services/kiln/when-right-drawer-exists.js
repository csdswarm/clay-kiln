'use strict';

const whenChildIsAdded = require('./when-child-is-added');

/**
 * Using the passed in kilnInput for subscribing and finding the station via the
 *   'schemaName', this method fires the callback when the publish drawer is
 *   opened and the '.right-drawer' element is rendered.
 *
 * This is useful when you want to make a small modification to the drawer.  If
 *   we need to make larger changes then we should override the drawer entirely.
 *
 * cb has the signature (rightDrawerElement) => undefined
 *
 * Note: this method takes the kilnInput as opposed to creating its own because
 *   either way I would need some way to free the memory when a component is no
 *   longer on the page.  If this service had one global subscription that ran
 *   an array of callbacks, then I'd also need to provide a way for the consumer
 *   to 'unsubscribe' which seemed more complex.
 *
 * @param {object} kilnInput
 * @param {function} cb
 */
module.exports = (kilnInput, cb) => {
  kilnInput.subscribe('OPEN_DRAWER', payload => {
    if (payload !== 'publish-page') {
      return;
    }

    whenChildIsAdded({
      cb,
      childClass: 'right-drawer',
      parentClass: 'kiln-wrapper'
    });
  }, false);
};
