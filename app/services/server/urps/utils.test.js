'use strict';

const { createUnityPermissions } = require('./utils'),
  { DEFAULT_STATION } = require('../../universal/constants'),
  { expect } = require('chai'),
  { unityAppDomainName } = require('../../universal/urps');

const rdcDomainName = DEFAULT_STATION.unityDomainName;

describe('server/urps/utils', () => {
  it('createUnityPermissions returns the correct unity permissions using the type and id', async () => {
    expect(createUnityPermissions(getMockUrpsPermissions())).to.deep.equal({
      [rdcDomainName]: {
        update: {
          footer: true,
          'page-template': true,
          'static-page': true,
          'meta-tags': true
        }
      },
      [unityAppDomainName]: {
        create: { 'global-alert': true },
        update: { 'global-alert': true }
      }
    });
  });
});

// helper fns

// this is a subset of output I grabbed locally
function getMockUrpsPermissions() {
  return [
    {
      name: rdcDomainName,
      id: '25b8f5df-aff1-41ce-83b4-68c0a5b289a1',
      type: 'station',
      core_id: 12,
      permissions: [
        {
          permissionId: '011fcede-0f18-40c4-8785-45fd599bfab3',
          permissionName: 'update',
          permissionCategoryId: '09e4e742-455f-4e3f-97b1-73e28109ef19',
          permissionCategoryName: 'footer'
        },
        {
          permissionId: '011fcede-0f18-40c4-8785-45fd599bfab3',
          permissionName: 'update',
          permissionCategoryId: '75a07cdc-b0a6-4313-b490-c11cb745a472',
          permissionCategoryName: 'page-template'
        },
        {
          permissionId: '011fcede-0f18-40c4-8785-45fd599bfab3',
          permissionName: 'update',
          permissionCategoryId: '7f9188a4-6802-49a3-b4e0-9e1cb5425925',
          permissionCategoryName: 'static-page'
        },
        {
          permissionId: '011fcede-0f18-40c4-8785-45fd599bfab3',
          permissionName: 'update',
          permissionCategoryId: '7f9a3fdf-dd9c-4839-8377-e28952c79f14',
          permissionCategoryName: 'meta-tags'
        }
      ]
    },
    {
      name: unityAppDomainName,
      id: '53f043a3-340b-45dd-8e9e-33b9779ae371',
      type: 'application',
      permissions: [
        {
          permissionId: '011fcede-0f18-40c4-8785-45fd599bfab3',
          permissionName: 'update',
          permissionCategoryId: 'b62b7d06-6e29-474e-8caf-1d38239a10a6',
          permissionCategoryName: 'global-alert'
        },
        {
          permissionId: 'd3e4f7ab-29cf-42e4-9361-138f8042fa77',
          permissionName: 'create',
          permissionCategoryId: 'b62b7d06-6e29-474e-8caf-1d38239a10a6',
          permissionCategoryName: 'global-alert'
        }
      ]
    }
  ];
}
