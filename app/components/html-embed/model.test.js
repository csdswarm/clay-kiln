/* eslint-disable max-nested-callbacks */
'use strict';

const chai = require('chai'),
  { expect } = chai,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift();

describe(dirname, () => {
  describe(filename, () => {
    const { render } = require('./model');

    describe('render', () => {
      it('should update the iframe width attribute to auto', () => {
        const uri = 'clay.radio.com/_components/html-embed/instances/1',
          data = {
            text:
              '<iframe src="https://embed.waze.com/iframe?zoom=14&amp;lat=33.748995&amp;lon=-84.387982&amp;ct=livemap&amp;pname=Entercom_929thegame" style="height:850px; width:100px;"></iframe>'
          },
          locals = {
            ancestry: {
              'clay.radio.com/_components/html-embed/instances/1': {
                name: 'html-embed',
                parents: [
                  'clay.radio.com/_components/two-column-component/instances/1'
                ]
              },
              'clay.radio.com/_components/html-embed/instances/2': {
                name: 'html-embed',
                parents: [
                  'clay.radio.com/_components/more-content-feed/instances/1'
                ]
              }
            }
          },
          result = render(uri, data, locals);

        expect(result).to.have.property('_computed');
        expect(result._computed).to.have.property('parents');
        expect(result._computed.parents).to.have.lengthOf(1);
        expect(result.text).to.eql('<iframe src="https://embed.waze.com/iframe?zoom=14&amp;lat=33.748995&amp;lon=-84.387982&amp;ct=livemap&amp;pname=Entercom_929thegame" style="height:850px; width:auto;"></iframe>');
      });
    });
  });
});
