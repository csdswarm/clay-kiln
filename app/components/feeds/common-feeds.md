## Common Feeds

Here are common feeds we have in use in prod if you need to debug any of them locally.

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
