'use strict';

const slugifyService = require('../../services/universal/slugify'),
  genres = [
    { img: 'Pop-4f2078aa-3ff5-4f65-b1a7-8fde547db31f', label: 'Pop' },
    { path: 'sports', img: 'Sports-38ff7af4-e9c8-431e-a9b6-5b731cb13f5a', label: 'Sports' },
    { img: 'Country-cdd632d4-31f6-4f28-a13d-9503375ac921', label: 'Country' },
    { img: 'HipHop-23beb86f-0e55-4718-8f0d-11dc8832ef6a', label: 'Hip Hop' },
    { path: 'news-talk', img: 'News-b347c36d-2e68-4f51-8255-a2037b2fbe0d', label: 'News' },
    { img: 'Rock-20e0377b-bb12-4d4e-a2c6-0ed41bc601ec', label: 'Rock' },
    { img: 'Alternative-2e1e0763-50f9-4e22-98c2-710a49f5a0b0', label: 'Alternative' }]
    .map(genre => {
      const safeLabel = `music/${slugifyService(genre.label)}`;

      return { css: safeLabel, path: safeLabel, ...genre };
    });

module.exports = {

  /**
   * Updates the view model for rendering
   *
   * @param {string} ref unused
   * @param {Object} data the model to update
   * @param {Object | undefined} locals unused
   * @returns {Object} the updated view model
   */
  render(ref, data) {
    data.genres = genres;
    return data;
  }
};
