/**
 * Replace references of clay sites with specified domain
 *
 * @param string
 * @param options
 * @returns {string}
 */
const replaceDomains = (string, options) => {
  const regex = /(www|[[a-zA-Z]+-]?clay)\.radio\.com/g;

  return string.replace(regex, options.hostname || 'clay.radio.com');
};

module.exports = function (doc, options) {

  // Replace all references to the previous env to the current
  doc._source = JSON.parse(replaceDomains(JSON.stringify(doc._source), options));

  if (typeof doc.fields !== 'undefined') {
    doc.fields = JSON.parse(replaceDomains(JSON.stringify(doc.fields), options));
  }

  doc._id = replaceDomains(doc._id, options);
};
