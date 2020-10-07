'use strict';

/**
 * returns the components yaml contents
 */
module.exports = (host, http) => {
  return '' +
`_components:
  feeds:
    instances:
      msn:
        meta:
          renderer: rss
          contentType: rss
          fileExtension: rss
          title: Radio.com Msn Rss Feed
          description: Most recent content from Radio.com for Msn
          link: ${http}://${host}
        index: published-content
        query:
          # needs to be fewer than 30
          # see 'Paging in large feeds'
          # https://partnerhub.msn.com/docs/spec/vcurrent/feed-specifications/AAsCh
          size: 25
          sort:
            date: desc
          query:
            bool:
              filter:
                - match:
                    contentType: article
                - match:
                    feeds.msn: true
                - range:
                    msnTitleLength:
                      # requirement found here
                      # https://partnerhub.msn.com/docs/spec/vcurrent/article-metadata/AAsCd
                      gt: 20
                - bool:
                    must_not:
                      term:
                        noIndexNoFollow: true
        transform: article
        format: msn
  feed-image:
    instances:
      new:
        credit: ''
        url: ''
        alt: ''`
};
