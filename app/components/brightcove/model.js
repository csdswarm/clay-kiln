'use strict';

module.exports.render = function (uri, data, locals) {
  console.log("render component");
  data.video = data.searchVideo || data.newVideo || null;
  console.log(data.video);
  return data;
};

module.exports.save = function (uri, data, locals) {
  console.log("save component");
  data.video = data.searchVideo || data.newVideo || null;
  console.log(data.video);
  return data;
};
