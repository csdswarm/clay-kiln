'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop();

describe.only(dirname, function () {
  const { formatSearchResult } = require('./query');

  it('parse item id from uri', () => {
    const itemId = 12345,
      uri = `clay.radio.com/_components/share/instances/${itemId}@published`,
      mockElasticSearchData = {
        hits: {
          hits: [
            {
              _id: uri
            }
          ]
        }
      };

    expect(
      formatSearchResult(
        mockElasticSearchData
      )
    ).to.deep.equal([
      {
        itemId: String(itemId)
      }
    ]);
  });
});
