'use strict';

module.exports = (ref, { text }) => ({
  role: 'body',
  text,
  format: 'html',
  textStyle: {
    fontSize: 15
  }
});
