/* eslint-disable max-nested-callbacks */
'use strict';
const
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  apNewsImporter = require('./ap-news-importer'),

  { expect } = chai;

chai.use(sinonChai);

describe('server', () => {
  afterEach(sinon.restore);

  describe('ap-news-importer', () => {
    function setup_apNewsImporter() {
      const { _internals: __, importArticle } = apNewsImporter;

      return { __, importArticle };
    }

    describe('importArticle', () => {
      async function setup_importArticle(options) {
        const setup = setup_apNewsImporter(),
          { importArticle } = setup,
          { apMeta } = options,
          result = await importArticle(apMeta);

        return { ...setup, result };
      }
    });
  });
})
;
