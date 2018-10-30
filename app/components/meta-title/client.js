'use strict';

const metaManager = require('../../services/client/meta-manager')();

document.addEventListener('mount', function (event) {

  let spaPayload, headComponentList, metaTitleData;

  try {
    spaPayload = JSON.parse(event.detail);
  } catch (error) {
    spaPayload = {
      head: []
    };
  }

  headComponentList = spaPayload.head;

  // Extract meta-title component data.
  metaTitleData = metaManager.extractComponentDataFromComponentList(headComponentList, 'meta-title');

  if (metaTitleData) {
    metaManager.updateTitleTag(metaTitleData.title);
    metaManager.updateMetaTag('property', 'og:title', metaTitleData.ogTitle);
  }

});
