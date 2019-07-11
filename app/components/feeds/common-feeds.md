## Common Feeds

Here are common feeds we have in use in prod if you need to debug any of them locally.

### Reverse Chron

This is created in the migration 20190228110000-feeds with a `PUT` to: /_components/feeds/instances/reversechron

By default, the query is to find the most recent 20 articles and galleries in elasticsearch. Additional query params can be added to the query string to modify this query.

```
{
  "index": "published-content",
  "query": {
    "size": 20,
    "sort": {
      "date": "desc"
    }
  },
  "meta": {
    "renderer": "rss",
    "contentType": "application/rss+xml",
    "fileExtension": "rss",
    "link": "'$http'://'$1'",
    "title": "Radio.com Reverse Chron Feed",
    "description": "Most recent content from Radio.com"
  },
  "transform": "article",
  "results": []
}
```

### Alexa Flash News

You can `PUT` this to this instance of feeds: /_components/feeds/instances/voice
```
{
  "index": "voice-syndication",
  "meta": { },
  "transform": "foo",
  "query": {
    "query": {
      "bool": {
        "filter": [
          {
            "term": { "site": "vulture" }
          },
          {
            "term": { "voiceDevice.alexa-flash-news": true }
          }
        ]
      }
    },
    "sort": {
      "date": "desc"
    },
    "size": 5,
    "_source": [
      "voiceDevice",
      "headline",
      "dek",
      "site",
      "date",
      "canonicalUrl"
    ]
  }
}
```
