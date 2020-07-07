module.exports = function (doc, options) {
  const regex = /(www|[[a-zA-Z]+-]?clay)\.radio\.com/g;

  let sourceString = JSON.stringify(doc._source);
  // Replace all references to the previous env to the current
  sourceString = sourceString.replace(regex, options.hostname || 'clay.radio.com');
  doc._source = JSON.parse(sourceString);

  if (typeof doc.fields !== 'undefined') {
    let fieldsString = JSON.stringify(doc.fields);
    // Replace all references to the previous env to the current
    fieldsString = fieldsString.replace(regex, options.hostname || 'clay.radio.com');
    doc.fields = JSON.parse(fieldsString);
  }

  doc._id = doc._id.replace(regex, options.hostname || 'clay.radio.com');
};
