'use strict';
const { expect } = require('chai'),
  amphora = require('./amphora');

describe('amphora', () => {
  describe('unityComponent', () => {
    const { unityComponent } = amphora;

    describe('render', () => {
      const { render } = unityComponent({});

      it('adds ancestry to locals', () => {
        const uri = 'clay.radio.com/_components/my-component/instances/some-instance',
          data = {},
          locals = {};

        render(uri, data, locals);

        expect(locals).to.have.property('ancestry');
        expect(locals.ancestry).to.have.property(uri);
      });

      it('updates existing ancestry in locals', () => {
        const uri = 'clay.radio.com/_components/my-component/instances/some-instance',
          testA = 'clay.radio.com/_components/some-child-component/instances/a',
          data = { someComponentList: [{ _ref: testA }] },
          locals = { ancestry: { [uri]: { name: 'my-component' } } };

        render(uri, data, locals);

        expect(locals.ancestry).to.have.property(uri);
        expect(locals.ancestry).to.have.property(testA);
      });

      it('adds parents computed property to result data', () => {
        const uri = 'clay.radio.com/_components/my-component/instances/some-instance',
          testA = 'clay.radio.com/_components/some-child-component/instances/a',
          data = { someComponentList: [{ _ref: testA }] },
          locals = { ancestry: { [uri]: { name: 'my-component' } } };

        render(uri, data, locals);

        expect(locals.ancestry[testA]).to.have.property('parents');
        expect(locals.ancestry[testA].parents).to.include(uri);
      });

      it('updates itself if it is the child of another component', () => {
        const uri = 'clay.radio.com/_components/my-component/instances/some-instance',
          testA = 'clay.radio.com/_components/some-child-component/instances/a',
          testB = 'clay.radio.com/_components/other-child-component/instances/b',
          data = { someComponentList: [{ _ref: testA }] },
          testBData = { otherComponent: { _ref: testA } },
          locals = { ancestry: { [uri]: { name: 'my-component' } } };

        render(uri, data, locals);

        expect(locals.ancestry).to.have.property(uri);
        expect(locals.ancestry).to.have.property(testA);
        expect(locals.ancestry).not.to.have.property(testB);
        expect(locals.ancestry[testA].parents).to.include(uri);
        expect(locals.ancestry[testA].parents).not.to.include(testB);

        render(testB, testBData, locals);

        expect(locals.ancestry).to.have.property(testB);
        expect(locals.ancestry[testA].parents).to.include(testB);
      });

      it('does not add duplicates to parents', () => {
        const uri = 'clay.radio.com/_components/my-component/instances/some-instance',
          testA = 'clay.radio.com/_components/some-child-component/instances/a',
          data = { someComponentList: [{ _ref: testA }] },
          locals = { ancestry: { [uri]: { name: 'my-component' } } };

        render(uri, data, locals);
        expect(locals.ancestry[testA].parents).to.have.lengthOf(1);

        render(uri, data, locals);
        expect(locals.ancestry[testA].parents).to.have.lengthOf(1);
      });

      it('adds parents as computed property to data', () => {
        const uri = 'clay.radio.com/_components/my-component/instances/some-instance',
          testA = 'clay.radio.com/_components/some-child-component/instances/a',
          data = { someComponentList: [{ _ref: testA }] },
          locals = { ancestry: { [uri]: { name: 'my-component' } } };

        render(uri, data, locals);

        const newData = render(testA, {}, locals);

        expect(newData).to.have.property('_computed');
        expect(newData._computed).to.have.property('parents');
        expect(newData._computed.parents).to.include(uri);
        expect(newData._computed.parents).to.have.lengthOf(1);
      });
    });
  });
});
