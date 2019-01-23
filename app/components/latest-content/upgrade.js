module.exports['1.0'] = function (uri, data, locals) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};
