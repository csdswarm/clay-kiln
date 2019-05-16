# How To Use This Component

The purpose of the feeds component is to expose collections of articles/videos/etc to different renderers. For example, if you need an RSS feed of latest videos, you could make a feed instance that specifies how to render the content in an RSS format. If you need a feed of articles for Amazon's Alexa to read, you make a feed component that aggregates and formats the data.

The end goal is to expose `feeds` component instances in such a way that we can scrape their final output and push the data into an S3 bucket to serve to the public. We don't want people hitting Clay directly because that traffic could overwhelm our servers/Elastic.

Because of this there is a division between required fields. Some are required as part of the Elastic API and some are required for the scraper.

## Required Properties

- `index` [String]: the Elastic index you're going to pull data from to construct a feed
- `query` [Object]: the query to be executed against the specified `index`
- `meta` [Object]: some descriptive data around the feed. Required properties below:
  - `s3_directory` [String]: specifies the S3 directory the feed will fall into. The scraper already has logic to determine the bucket, but if you need the scraped file placed in a specific directory you'll need to define the path in this property. It should not have a `/` at the beginning.
  - `renderer` [String]: indicates the extension to use when requesting the feed. Set to any value where we have a supported renderer (`alexa`, `rss`, etc.). Should only be the extension value without the `.` preceding it
  - `fileExtension` [String]: can be confused with `type`, but this is the extension the the scraped file should be save with when storing in S3. Should only be the extension value without the `.` preceding it.
  - `contentType` [String]: the value of the `Content-Type` header that S3 should send when serving the file (e.g. `application/rss+xml`)

# skipQuery

The `model.js` will request the Elastic data for the component on render, but if you only want to analyze the data in the component rather than the results it returns, add the param `skipQuery=true` to your request url.

i.e. `vulture.com/_components/feeds/instances/foo?skipQuery=true`
