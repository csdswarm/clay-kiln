'use strict';

const _get = require('lodash/get'),
  clayutils = require('clayutils'),
  rest = require('../../../universal/rest');

let updatingPage = false,
  updatingComponent;

function isInstagramComponent(uri) {
  return uri && clayutils.getComponentName(uri) === 'instagram-post';
}

/**
 * Check if a Kiln mutation should trigger a page update.
 * @param {object} mutation
 * @returns {boolean}
 */
function shouldUpdatePage(mutation) {
  if (mutation.type !== 'UPDATE_COMPONENT') return;

  if (!isInstagramComponent(mutation.payload.uri)) return;

  // if we're in the middle of a page update, don't trigger another update!
  if (updatingPage) return;

  updatingComponent = mutation.payload.uri;

  return true;
}

function saveUpdates(store, uri, data) {
  return store.dispatch('saveComponent', {
    uri,
    data: { html: data.html }
  });
}

function updateComponent(store) {
  const pageProtocol = _get(window, 'location.protocol', 'http:');
  let componentEl;

  updatingPage = true;

  if (updatingComponent) {
    componentEl = document.querySelector(`[data-uri="${updatingComponent}"]`);

    if (componentEl) {
      componentEl.style.opacity = '.2';
      componentEl.style.background = 'grey';
    }
  }

  return rest.get(`${pageProtocol}//${updatingComponent}`)
    .then(payload => rest.put(`${pageProtocol}//${updatingComponent}`, payload))
    .then(payload => saveUpdates(store, updatingComponent, payload))
    .catch(console.error)
    .then(() => {
      updatingPage = false;

      if (componentEl) {
        componentEl.style.removeProperty('opacity');
        componentEl.style.removeProperty('background');
      }
    });
}

/**
 * Updates the page after the last save has completed.
 * @param {object} store
 */
function updateOnSaveComplete(store) {
  const unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'FINISH_PROGRESS' && mutation.payload === 'save') {
      updateComponent(store);
      unsubscribe();
    }
  });
}

module.exports = () => {
  window.kiln.plugins.instagram = (store) => {
    store.subscribe(mutation => {
      if (!shouldUpdatePage(mutation)) return;
      updateOnSaveComplete(store);
    });
  };
};
