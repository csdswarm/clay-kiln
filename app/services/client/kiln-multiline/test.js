'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  { normalizeEmptyMultiLineContent } = require('./normalize-empty-multiline-content'),
  sinon = require('sinon'),
  { jsdom } = require('jsdom');

describe(dirname, () => {
  describe(filename, () => {
    it('resets empty multiline content', () => {
      const mockKilnInput = {
          saveComponent: sinon.spy()
        },
        fieldNames = new Set(['multiline']),
        mockPayload = {
          uri: 'foo-component',
          data: {
            simpleParagraph: '<p></p>',
            multiline: '<p><br /></p>'
          },
          fields: ['multiline']
        },
        mockDoc = jsdom('<!DOCTYPE html>'),
        inputPayload = { ...mockPayload };

      global.document = mockDoc;

      normalizeEmptyMultiLineContent(fieldNames, mockKilnInput)(inputPayload);
      expect(
        mockPayload.data
      ).to.deep.equal({
        ...mockPayload.data,
        multiline: ''
      });
      expect(
        mockKilnInput.saveComponent.args[0]
      ).to.deep.equal([
        mockPayload.uri,
        mockPayload.data
      ]);
    });

    it('ignores filled multiline content', () => {
      const mockKilnInput = {
          saveComponent: sinon.spy()
        },
        fieldNames = new Set(['multiline']),
        mockPayload = {
          uri: 'foo-component',
          data: {
            multiline: '<p>I am some content</p>'
          },
          fields: ['multiline']
        },
        mockDoc = jsdom('<!DOCTYPE html>'),
        inputPayload = { ...mockPayload };

      global.document = mockDoc;

      normalizeEmptyMultiLineContent(fieldNames, mockKilnInput)(inputPayload);
      expect(
        mockKilnInput.saveComponent.args.length
      ).to.equal(0);
      expect(
        inputPayload
      ).to.deep.equal(mockPayload);
    });
  });
});
