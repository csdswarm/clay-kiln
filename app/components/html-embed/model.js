'use strict';

const log = require('../../services/universal/log').setup({ file: __filename }),
  getBadSources = require('../../services/universal/get-bad-sources'),
  { SERVER_SIDE } = require('../../services/universal/constants'),
  { unityComponent } = require('../../services/universal/amphora'),
  { getComponentName } = require('clayutils'),
  isTwoColumnComponent = (data) => {
    return data._computed.parents.some(ref => getComponentName(ref) === 'two-column-component');
  };

module.exports = unityComponent({
  render: async (uri, data) => {
    if (typeof data.text !== 'string') {
      log('error', 'HTML Embed contains malformed data', { uri });
      data.text = '';
    }
  
    data.isIframe = data.text.indexOf('<iframe') !== -1;
    if (data.isIframe && isTwoColumnComponent(data)) {
      data.text = data.text.replace(/(width:.+;)/g, 'width:auto;');
    }
    
    return data;
  },
  save: async (uri, data, locals) => {
    // server side only check so user can get validation error from ui
    if (SERVER_SIDE) {
      const hasBadSources = (await getBadSources(data.text, locals)).length;

      if (hasBadSources) {
        data.text = ''; // remove the embed text since there was bad sources in the script tag
      }
    }
    
    return data;
  }
});
