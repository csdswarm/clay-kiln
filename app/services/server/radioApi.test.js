// 'use strict';
//
// @TODO Switch db to be ioredis. Will need to use ioredis mock as we do not have an
//  instance of redis on the box to access
//
// const expect = require('chai').expect,
//   rest = require('../universal/rest'),
//   dirname = __dirname.split('/').pop(),
//   filename = __filename.split('/').pop().split('.').shift(),
//   lib = require('./' + filename),
//   sinon = require('sinon'),
//   db = require('./db');
//
// describe(dirname, () => {
//   let sandbox;
//
//   describe(filename, () => {
//     beforeEach(() => {
//       sandbox = sinon.sandbox.create();
//     });
//
//     afterEach(() => {
//       sandbox.restore();
//     });
//
//     describe('get', () => {
//
//       it('will hit the api endpoint and return with a success when not cached', async () => {
//         const endpoint = 'endpoint',
//           params = {
//             this: 'that',
//             encoded: 'a test'
//           },
//           success = { data: { success: true } },
//           key = 'api.radio.com/v1/endpoint?this=that&encoded=a%20test',
//           url = 'https://api.radio.com/v1/endpoint?this=that&encoded=a test';
//
//         sandbox.stub(db, 'get').rejects(null);
//         sandbox.stub(db, 'put').resolves(null);
//         sandbox.stub(rest, 'get').resolves(success);
//
//         // eslint-disable-next-line one-var
//         const result = await lib.get(endpoint, params);
//
//         expect(db.get.callCount).to.eql(1);
//         expect(db.get.args[0][0]).to.eql(key);
//
//         expect(result).to.eql(success);
//         expect(rest.get.callCount).to.eql(1);
//         expect(rest.get.args[0][0]).to.eql(url);
//
//         expect(db.put.callCount).to.eql(1);
//         expect(db.put.args[0][0]).to.eql(key);
//         expect(db.put.args[0][1]).to.eql(JSON.stringify(success));
//       });
//
//       it('will hit the passed in endpoint and return with a success when not cached', async () => {
//         const endpoint = 'http://my.magic/endpoint',
//           params = {
//             this: 'that',
//             encoded: 'a test'
//           },
//           success = { data: { success: true } },
//           key = 'my.magic/endpoint?this=that&encoded=a%20test',
//           url = 'http://my.magic/endpoint?this=that&encoded=a test';
//
//         sandbox.stub(db, 'get').rejects(null);
//         sandbox.stub(db, 'put').resolves(null);
//         sandbox.stub(rest, 'get').resolves(success);
//
//         // eslint-disable-next-line one-var
//         const result = await lib.get(endpoint, params);
//
//         expect(db.get.callCount).to.eql(1);
//         expect(db.get.args[0][0]).to.eql(key);
//
//         expect(result).to.eql(success);
//         expect(rest.get.callCount).to.eql(1);
//         expect(rest.get.args[0][0]).to.eql(url);
//
//         expect(db.put.callCount).to.eql(1);
//         expect(db.put.args[0][0]).to.eql(key);
//         expect(db.put.args[0][1]).to.eql(JSON.stringify(success));
//       });
//
//       it('will not hit the api endpoint and return with a success when cached', async () => {
//         const endpoint = 'endpoint',
//           params = {
//             this: 'that',
//             encoded: 'a test'
//           },
//           success = { data: { success: true }, updated_at: new Date() },
//           key = 'api.radio.com/v1/endpoint?this=that&encoded=a%20test';
//
//         sandbox.stub(db, 'get').resolves(success);
//         sandbox.stub(db, 'put').resolves(success);
//         sandbox.stub(rest, 'get').resolves(success);
//
//         // eslint-disable-next-line one-var
//         const result = await lib.get(endpoint, params);
//
//         expect(db.get.callCount).to.eql(1);
//         expect(db.get.args[0][0]).to.eql(key);
//
//         expect(result).to.eql(success);
//         expect(rest.get.callCount).to.eql(0);
//         expect(db.put.callCount).to.eql(0);
//       });
//
//       it('will hit the api endpoint and return with a success when cache has expired', async () => {
//         const endpoint = 'endpoint',
//           params = {
//             this: 'that',
//             encoded: 'a test'
//           },
//           dbSuccess = { data: { success: true }, updated_at: new Date('1-1-2018') },
//           restSuccess = { data: { success: true } },
//           key = 'api.radio.com/v1/endpoint?this=that&encoded=a%20test',
//           url = 'https://api.radio.com/v1/endpoint?this=that&encoded=a test';
//
//         sandbox.stub(db, 'get').resolves(dbSuccess);
//         sandbox.stub(db, 'put').resolves(null);
//         sandbox.stub(rest, 'get').resolves(restSuccess);
//
//         // eslint-disable-next-line one-var
//         const result = await lib.get(endpoint, params);
//
//         expect(db.get.callCount).to.eql(1);
//         expect(db.get.args[0][0]).to.eql(key);
//
//         expect(result).to.eql(restSuccess);
//         expect(rest.get.callCount).to.eql(1);
//         expect(rest.get.args[0][0]).to.eql(url);
//
//         expect(db.put.callCount).to.eql(1);
//         expect(db.put.args[0][0]).to.eql(key);
//         expect(db.put.args[0][1]).to.eql(JSON.stringify({ ...dbSuccess, updated_at: result.updated_at }));
//       });
//
//       it('will return an empty object when everything fails', async () => {
//         const endpoint = 'endpoint';
//
//         sandbox.stub(db, 'get').rejects(null);
//         sandbox.stub(db, 'put').rejects(null);
//         sandbox.stub(rest, 'get').rejects(null);
//
//         // eslint-disable-next-line one-var
//         const result = await lib.get(endpoint);
//
//         expect(result).to.eql({});
//         expect(db.get.callCount).to.eql(1);
//         expect(rest.get.callCount).to.eql(1);
//         expect(db.put.callCount).to.eql(0);
//       });
//
//       it('will return an empty object when a custom validation fails', async () => {
//         const endpoint = 'endpoint',
//           success = { data: { success: false } };
//
//         sandbox.stub(db, 'get').rejects(null);
//         sandbox.stub(db, 'put').rejects(null);
//         sandbox.stub(rest, 'get').resolves(success);
//
//         // eslint-disable-next-line one-var
//         const result = await lib.get(endpoint, null, (response) => response.data.success === true);
//
//         expect(result).to.eql({});
//         expect(db.get.callCount).to.eql(1);
//         expect(rest.get.callCount).to.eql(1);
//         expect(db.put.callCount).to.eql(0);
//       });
//
//     });
//
//   });
// });
