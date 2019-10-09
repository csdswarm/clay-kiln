'use strict';

const { assert, expect } = require('chai'),
  { addMiddlewareToUnsafeMethods, isRobot, wrapInTryCatch } = require('./utils'),
  express = require('express'),
  getPort = require('get-port'),
  axios = require('axios');

describe('utils', () => {
  describe('isRobot', () => {
    it('should return true if no username exists', () => {
      expect(isRobot({})).to.be.true;
    });
    it("should return false if 'username' exists", () => {
      expect(isRobot({ username: 'mr robot' })).to.be.false;
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
    it('should pass a failure to the application default error handler', function () {
      // shouldn't take longer than 200ms
      this.timeout(200);

      // gotta return a promise because we can't await express' `listen`
      return new Promise(async (resolve, reject) => {
        try {
          const app = express(),
            port = await getPort(),
            failedErr = new Error('failed !'),
            failAsynchronously = () => new Promise((resolve, reject) => {
              setTimeout(() => reject(failedErr), 0);
            }),
            failMiddleware = async () => {
              await failAsynchronously();
            },
            // the error handler must have four arguments per Express
            // eslint-disable-next-line no-unused-vars
            defaultErrorHandler = (err, req, res, next) => {
              try {
                expect(err).to.equal(failedErr);
                resolve();
              } catch (testFailed) {
                reject(testFailed);
              }
            };

          app.use(wrapInTryCatch(failMiddleware), defaultErrorHandler)
            .listen(port, async () => {
              try {
                await axios.get(`http://localhost:${port}`);
              } catch (err) {
                reject(err);
              }
            });
        } catch (err) {
          reject(err);
        }
      });
    });

    it('should work just fine otherwise', function () {
      // shouldn't take longer than 200ms
      this.timeout(200);

      // gotta return a promise because we can't await express' `listen`
      return new Promise(async (resolve, reject) => {
        try {
          const app = express(),
            port = await getPort(),
            passAsynchronously = () => new Promise(resolve => {
              setTimeout(resolve, 0);
            }),
            middleware1 = async (req, res, next) => {
              await passAsynchronously();
              next();
            },
            middleware2 = () => {
              resolve();
            },
            // the error handler must have four arguments per Express
            // eslint-disable-next-line no-unused-vars, handle-callback-err
            defaultErrorHandler = (err, req, res, next) => {
              try {
                assert.fail('the default error handler should not run');
              } catch (testFailed) {
                reject(testFailed);
              }
            };

          app.use(wrapInTryCatch(middleware1), defaultErrorHandler, middleware2)
            .listen(port, async () => {
              try {
                await axios.get(`http://localhost:${port}`);
              } catch (err) {
                reject(err);
              }
            });
        } catch (err) {
          reject(err);
        }
      });
    });
  });
});
