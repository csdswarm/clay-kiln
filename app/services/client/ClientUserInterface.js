'use strict';

const clientCommunicationBridge = require('./ClientCommunicationBridge')();

/**
 *
 * ClientUserInterface library contains communications/management logic related to the user.
 *
 * See also: spa/src/lib/SpaUserInterface.js
 *
 */
class ClientUserInterface {
  /**
   *
   * Adds events related to users
   *
   * @param {Node} doc
   * @returns {Node} - document with events attached
   */
  addEventListener(doc) {
    // Attach favorite button click handlers
    doc.querySelectorAll('[data-fav-station]').forEach(element => {
      element.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const currentClass = Array.from(element.classList).find((className) => /-active$/i.test(className)),
          nextClass = currentClass.includes('--active')
            ? currentClass.replace('--active', '--not-active')
            : currentClass.replace('--not-active', '--active'),
          func = currentClass.includes('--active') ? 'removeFavorite' : 'addFavorite';

        if (await this[func](element.dataset.favStation)) {
          document.querySelectorAll(`[data-fav-station="${element.dataset.favStation}"]`).forEach(station =>
            station.classList.replace(currentClass, nextClass)
          );
        }
      });
    });
    return doc;
  }

  /**
   *
   * Add a favorite station
   *
   * @param {number} stationId
   * @returns {Promise<any>} - Passed in stationId or null
   */
  async addFavorite(stationId) {
    return await clientCommunicationBridge.sendMessage('SpaUserFavorite', {  action: 'addFavorite', stationId });
  }

  /**
   *
   * remove a favorite station
   *
   * @param {number} stationId
   * @returns {Promise<any>} - Passed in stationId or null
   */
  async removeFavorite(stationId) {
    return await clientCommunicationBridge.sendMessage('SpaUserFavorite', {  action: 'removeFavorite', stationId });
  }

}

// Export to factory to simplify standard import statements.
module.exports = function () {
  return new ClientUserInterface();
};
