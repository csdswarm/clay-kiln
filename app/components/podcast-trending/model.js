'use strict';

const { unityComponent } = require('../../services/universal/amphora');

function rndPick(arr) {
  let out = '';
  const num = Math.floor( Math.random() * 12) + 3;

  for (let i = 0; i < num; i++) {
    out += arr[Math.floor(
      Math.random() * arr.length
    )];
    if ( i === 0 ) out = out[0].toUpperCase() + out.slice(1,-1);
    if (i < num - 1) out += ' ';
  }

  return out;
}

function rndHex() {
  return ('000000' + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6);
}

module.exports = unityComponent({
  /**
   * Updates the data for the template prior to render
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  render: (uri, data) => {

    data._computed.items = Array(10)
      .fill({})
      .map((el, i) => {
        return {
          title: `Podacst Title ${i + 1}`,
          description: rndPick('lorem ipsum dolor sit amet, consectetur adipiscing elit praesent elementum ligula eget ligula bibendum venenatis'.split(' ')),
          imageUrl: `https://via.placeholder.com/600/${rndHex()}/ffffff/?text=img-${i + 1}`
        };
      });
    return data;
  },

  /**
   * Makes any necessary modifications to data just prior to persisting it
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  save: (uri, data) => {
    return data;
  }
});
