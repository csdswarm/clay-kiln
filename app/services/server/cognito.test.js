/* eslint-disable */

'use strict';

const proxyquire = require('proxyquire'),
  { assert, expect } = require('chai'),
  sinon = require('sinon');

describe('cognito tests', () => {
  describe('refreshToken', () => {
    // generates standard proxies for required components used by getAllPermissions
    function requireCognitoRefreshTokenStandard({ stuff, log }) {
      return proxyquire('./cognito', {});
    }

  });
});
