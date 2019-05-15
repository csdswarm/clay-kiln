'use strict';

const approvedAuthors = [
  'a&e',
  'a24',
  'abc',
  'amazon studios',
  'amc',
  'bbc america',
  'ben poster',
  'black label media',
  'bobby doherty',
  'bravo',
  'cartoon network',
  'cbs',
  'channel four',
  'columbia',
  'comedy central',
  'courtesy of vendor',
  'crackle',
  'dc entertainment',
  'discovery channel',
  'disney',
  'dreamworks',
  'e!',
  'espn',
  'film forum',
  'filmmagic',
  'focus features',
  'fox',
  'freeform',
  'fx',
  'fxx',
  'gc images',
  'getty',
  'hbo ',
  'hulu',
  'ifc',
  'itv',
  'jed egan',
  'konstantin sergeyev',
  'lifetime',
  'lionsgate',
  'logo',
  'lucafilm',
  'maia stern',
  'marvel studios',
  'melissa hom',
  'mgm',
  'miramax',
  'msnbc',
  'mtv',
  'nbc',
  'netflix',
  'new york magazine',
  'open road',
  'own',
  'paramount',
  'patrick mcmullan',
  'pbs',
  'pixar',
  'radius',
  'roadside attractions',
  'sara kinney',
  'sarah hanssen',
  'showtime',
  'starz',
  'stephanie szerlip',
  'summit entertainment',
  'sundance',
  'syfy',
  'tbs',
  'the cw',
  'the weinstein company',
  'tlc',
  'tnt',
  'tristar',
  'twentieth century fox',
  'united artists',
  'universal pictures',
  'usa',
  'vh1',
  'warner bros.',
  'wgn',
  'wireimage'
];

/**
 * Check to ensure we're getting images from
 * valid authors
 *
 * @param {String} credit
 * @returns {Boolean}
 */
function checkApproved(credit) {
  var lowerCredit = credit.toLowerCase();

  return approvedAuthors.find(author => lowerCredit.includes(author)) !== undefined;
}

module.exports = approvedAuthors;
module.exports.checkApproved = checkApproved;
