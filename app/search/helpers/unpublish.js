'use strict';

const db = require('../../services/server/db'),
  log = require('../../services/universal/log').setup({file: __filename}),
  { elastic } = require('amphora-search'),
  { find, forEach } = require('lodash'),
  { isOpForArticle } = require('../filters');

/**
 * findSourceComponentInPage
 *
 * This function iterates through page data to find the component ref that we need to unpublish
 * we use the same filter as that applied in the handler to filter for the op we want to publish
 * we need to iterate over all content arrays becausenews we don't necessarily know which content array the component we're looking for is stored in
 * for example, original-video pages store the lede-video cmpt in page.splashHeader, whereas article components are stored at page.main
 *
 * @param {Object} data page data
 * @param {Function} contentFilter predicate to find the component we're looking for
 * @returns {String} the ref for the component we're looking for
 */
function findSourceComponentInPage(data, contentFilter) {
  let cmpt;

  // loop through each content array in the page object
  forEach(data, (content) => {
    // filter for the component we want in each content array
    cmpt = find(content, (key) => contentFilter({ key }));

    // stop looping when component is found
    if (cmpt) { return false; }
  });

  return cmpt;
}

/**
 * @param {String} index
 * @param {Function} filter predicate to find the component we use as the source of truth for the index's document
 * @returns {Promise}
 */
function unpublish(index, filter) {
  return function ({ uri }) {
    return db.get(`${uri}@published`)
      .then(data => {
        const ref = findSourceComponentInPage(data, filter);

        // confirm the page has the ref we're looking for
        if (ref) {
          elastic.existsDocument(index, ref).then(exists => {
            if (exists) {
              elastic.del(index, ref)
                .then(log('info', `Successfully unpublished ${uri}`))
                .catch( e => {
                  log('error', `Error deleting ${uri} from elastic: `, { error: e.message });
                });
            }
          });
        } else {
          log('debug', `Data source component not found in index ${index}`);
        }
      })
      .catch(e => {
        log('error', `Error unpublishing ${uri}:`, { error: e.message });
      });
  };
}

/**
 * Given a page, an index, and a filter which specifies a type of component, will find the first
 * matching component within an article's content and remove its data from the specified index
 * @param {String} index
 * @param {Function} filter used to find the component within an article's content
 * @returns {Promise}
 */
function unpublishArticleContent(index, filter) {
  return function ({ uri }) {
    return db.get(`${uri}@published`)
      .then(pageData => {
        const articleRef = findSourceComponentInPage(pageData, isOpForArticle);

        if (articleRef) {
          db.get(articleRef)
            .then(articleData => {
              if (articleData && articleData.content) {
                const cmpt = find(articleData.content, (o) => filter({ key: o._ref }));

                if (cmpt) {
                  elastic.existsDocument(index, cmpt._ref).then(exists => {
                    if (exists) {
                      elastic.del(index, cmpt._ref)
                        .then(log('info', `Successfully removed ${cmpt._ref} from ${index}`))
                        .catch( e => {
                          log('error', `Error deleting ${uri} from elastic: `, { error: e.message });
                        });
                    }
                  });
                } else {
                  log('debug', `Component not found in index ${index}`);
                }
              }
            });
        } else {
          log('debug', `Article component not found at ${uri}`);
        }
      })
      .catch(e => {
        log('error', `Error unpublishing article content from ${uri}:`, { error: e.message });
      });
  };
}

module.exports = unpublish;
module.exports.query;
module.exports.unpublishArticleContent = unpublishArticleContent;
