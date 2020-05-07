'use strict';

/**
 * returns the components yaml contents
 */
module.exports = (host, http) => {
  return '' +
`_components:
  feeds:
    instances:
      smart-news:
        attr:
          "xmlns:snf": "http://www.smartnews.be/snf"
        meta:
          renderer: rss
          contentType: rss
          fileExtension: rss
          title: RADIO.COM
          description: "RADIO.COM's latest news"
          link: ${http}://${host}
          # amphora-rss adds the contents of 'opt' as a child to the to the
          # channel element.  see the amphora-rss code for details
          opt:
            - "snf:logo":
              - url: "https://images.radio.com/aiu-media/rdclogo290x50-8a7d28ca-8a39-49f5-9c39-97147503755d.png"
        index: published-content
        query:
          # the hard max for smart news is 1MB which they say is approximately
          #  100.  50 is safe for now, we can adjust it as-needed.
          # https://publishers.smartnews.com/hc/en-us/articles/360010977793#how-many-items-should-i-prepare-in-one-document
          size: 50
          sort:
            date: desc
          query:
            bool:
              filter:
                - terms:
                    sectionFront:
                      - music
                      - news
                      - sports
                - match:
                    feeds.smartNews: true
                - bool:
                    must_not:
                      term:
                        noIndexNoFollow: true
        transform: content
        format: smart-news`
};
