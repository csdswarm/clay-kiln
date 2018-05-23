'use strict';

const dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  {expect} = require('chai'),
  helpers = require('./helpers'),
  lib = require('./only-one-required');

describe(dirname, function () {
  describe(filename, function () {
    describe('validate', function () {
      const fn = lib[this.title],
        validations = lib['validations'];

      it('doesn\'t do anything if components aren\'t there', function () {
        const state = {
          components: {
            'www.url.com/_components/some-other-component/instances/a': {a: 'b'}
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('returns error if subscription plans components are on the page and no one is checked', function () {
        const subscriptionPlans = validations[0],
          state = {
            components: {
              'www.url.com/_components/subscription-plan/instances/a': {isDefaultSelection: false},
              'www.url.com/_components/subscription-plan/instances/b': {isDefaultSelection: false},
              'www.url.com/_components/subscription-plan/instances/c': {isDefaultSelection: false},
            }
          },
          firstComponent = Object.keys(state.components)[0];

        expect(fn(state)).to.eql([{
          uri: firstComponent,
          field: subscriptionPlans.targetField,
          preview: subscriptionPlans.previewMessage,
          location: helpers.labelUtil(helpers.getComponentName(firstComponent))
        }]);
      });

      it('returns error if subscription plans components are on the page and more than one is checked', function () {
        const state = {
            components: {
              'www.url.com/_components/subscription-plan/instances/a': {isDefaultSelection: true},
              'www.url.com/_components/subscription-plan/instances/b': {isDefaultSelection: true},
              'www.url.com/_components/subscription-plan/instances/c': {isDefaultSelection: false},
            }
          },
          subscriptionPlans = validations[0],
          firstComponent = Object.keys(state.components)[0];

        expect(fn(state)).to.eql([{
          uri: firstComponent,
          field: subscriptionPlans.targetField,
          preview: subscriptionPlans.previewMessage,
          location: helpers.labelUtil(helpers.getComponentName(firstComponent))
        }]);
      });
    });
  });
});
