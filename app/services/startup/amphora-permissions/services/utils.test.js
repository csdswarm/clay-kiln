'use strict';

const { assert, expect } = require('chai'),
  sinon = require('sinon'),
  { addMiddlewareToUnsafeMethods, isEditor, wrapInTryCatch } = require('./utils'),
  express = require('express');

describe('permissions utils', () => {
  describe('isEditor', () => {
    it('should return false if username exists', () => {
      expect(isEditor({})).to.be.false;
    });
    it("should return false if 'username' exists", () => {
      expect(isEditor({ user: { username: 'not a robot' } })).to.be.true;
    });
  });

  describe('addMiddlewareToUnsafeMethods', () => {
    it('should attach the middleware to put/post/patch/delete', () => {
      const router = express.Router(),
        testPath = '/test',
        expectedMethods = [
          { put: true },
          { post: true },
          { patch: true },
          { delete: true }
        ];

      function myMiddleware() {}

      addMiddlewareToUnsafeMethods(router, testPath, myMiddleware);

      // there should only be four routes defined
      expect(router.stack.length).to.equal(4);

      // apparently this is how we get at the internals
      // https://stackoverflow.com/a/14934933
      for (const [idx, layer] of Object.entries(router.stack)) {
        const { methods, path } = layer.route,
          middleware = layer.route.stack[0].name;

        expect(path).to.equal(testPath);
        expect(middleware).to.equal('myMiddleware');
        expect(methods).to.deep.equal(expectedMethods[idx]);
      }
    });
  });

  describe('wrapInTryCatch', () => {
    it('calls next with the error', async () => {
      const failedErr = new Error('failed !'),
        failMiddleware = async () => {
          throw failedErr;
        },
        middleware = wrapInTryCatch(failMiddleware),
        req = {},
        res = {},
        next = sinon.fake();

      await middleware(req, res, next);
      assert(next.calledOnce);
      assert(next.calledWith(failedErr));
    });

    it("doesn't call next on success", async () => {
      const successMiddleware = sinon.fake(),
        middleware = wrapInTryCatch(successMiddleware),
        req = {},
        res = {},
        next = sinon.fake();

      await middleware(req, res, next);

      assert(next.notCalled);
      assert(successMiddleware.calledOnce);
      assert(successMiddleware.calledWith(req, res, next));
    });
  });
});
