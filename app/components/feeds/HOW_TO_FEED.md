# How To Use This Component

The purpose of the feeds component is to expose collections of articles/videos/etc to different renderers. For example, if you need an RSS feed of latest videos, you could make a feed instance that specifies how to render the content in an RSS format. If you need a feed of articles for Amazon's Alexa to read, you make a feed component that aggregates and formats the data.

The end goal is to expose `feeds` component instances in such a way that we can scrape their final output and push the data into an S3 bucket to serve to the public. We don't want people hitting Clay directly because that traffic could overwhelm our servers/Elastic.

Because of this there is a division between required fields. Some are required as part of the Elastic API and some are required for the scraper.

## How it works

Just like a normal component. When hitting an instance, model.js -> render is hit. By adding an extension to the endpoint (.rss, .atom), the result is then passed to that model ie. rss.model.js, atom.model.js.

`rss.model.js` passes this data to the transform that was saved onto the component. For reversechron, this is  article, so the data is passed to `transforms/article.js`. To add a new transform, create a file in transforms/*.js and then add it to `transforms/index.js`. RSS transform names are prepended with "rss-" in this mapper.

## Published Content in Elasticsearch

When content is published, there is a redis-bus listener in `/search/handlers/published-content.js` pushing the content to Elasticsearch.

Since we are rendering the html outside of amphora through feed.hbs templates, we don't have the data attached to component instances available in the handlebars template as usual. This requires us to attach this data manually to the doc that is saved to Elasticsearch. This is already being done for slides, lead, and content, but if other components need to be rendered in the feed in the future, their data will need to be added via the published-content.js function on save.

## Feed Templates

To be able to differentiate regular templates from feed templates, we separated them into their own `feed.hbs` files. `/services/startup/feed-components.js` searches for all components with a feed.hbs template and makes them available for feeds to use. These templates are then available in feed-components.renderComponent. This is done this way because feed templates don't need nearly as much markup as regular templates.

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

i.e. `radio.com/_components/feeds/instances/reversechron?skipQuery=true`
