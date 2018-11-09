'use strict';

const helpers = require('../../services/universal/helpers'),
  Handlebars = require('Handlebars');

for (const helper in helpers) {
  if (typeof helpers[helper] === 'function') {
    Handlebars.registerHelper(helper, helpers[helper]);
  }
}

// eslint-disable-next-line one-var
const ClayHandlebars = require('clayhandlebars')(Handlebars),
  templates = {
    'more-content-feed': ClayHandlebars.compile(`
    <li>
    <a class="links__link links__link--{{ feedItem.articleType }}" href="{{ feedItem.canonicalUrl }}"
       data-track-type="feedItem-link"
       data-track-component-name="more-content-feed"
       data-track-page-uri="{{ feedItem.pageUri }}"
       data-track-headline="{{ feedItem.primaryHeadline }}"
       data-track-component-title="More Content Feed"
       data-track-sectionFront="{{ feedItem.articleType }}">
      <div class="link__thumb" style="background-image:url({{ feedItem.feedImgUrl }});">
        {{#ifAll (compare ../populateFrom 'all') feedItem.articleType}}
          <span class="thumb__section-front">{{{ feedItem.articleType }}}</span>
        {{/ifAll}}
        {{#unless (compare ../locationOfContentFeed 'homepage') }}
          {{#ifAny (compare feedItem.lead 'youtube') (compare feedItem.lead 'brightcove')}}
            <span class="thumb__content-type">
              {{{ read 'components/more-content-feed/media/watch.svg' }}}
            </span>
          {{/ifAny}}
          {{#if (compare feedItem.lead 'audio')}}
            <span class="thumb__content-type">
              {{{ read 'components/more-content-feed/media/listen.svg' }}}
            </span>
          {{/if}}
        {{/unless}}
        <span class="thumb__datetime-posted">
          {{#if (isPublished24HrsAgo feedItem.date) }}
            {{{ hrsOnlyTimestamp feedItem.date }}}
          {{else}}
            {{ formatLocalDate feedItem.date 'MMMM D, YYYY' }}
          {{/if}}
        </span>
      </div>
      <div class="link__info">
        <span class="info__headline">{{{ feedItem.primaryHeadline }}}</span>
        <span class="info__teaser">{{{ feedItem.teaser }}}</span>
        <span class="info__datetime-posted">
          {{#if (isPublished24HrsAgo feedItem.date) }}
            {{{ hrsOnlyTimestamp feedItem.date }}}
          {{else}}
            {{ formatLocalDate feedItem.date 'MMMM D, YYYY' }}
          {{/if}}
        </span>
      </div>
    </a>
  </li>`),
    'tag-page': ClayHandlebars.compile(`<li>
    <a class="links__link links__link--{{ feedItem.articleType }}" href="{{ feedItem.canonicalUrl }}"
       data-track-type="feedItem-link"
       data-track-component-name="more-content-feed"
       data-track-page-uri="{{ feedItem.pageUri }}"
       data-track-headline="{{ feedItem.primaryHeadline }}"
       data-track-component-title="More Content Feed"
       data-track-sectionFront="{{ feedItem.articleType }}">
      <div class="link__thumb" style="background-image:url({{ feedItem.feedImgUrl }});">
        <span class="thumb__section-front">{{{ feedItem.articleType }}}</span>
        {{#ifAny (compare feedItem.lead 'youtube') (compare feedItem.lead 'brightcove')}}
          <span class="thumb__content-type">
            {{{ read 'components/tag-page/media/watch.svg' }}}
          </span>
        {{/ifAny}}
        {{#if (compare feedItem.lead 'audio')}}
          <span class="thumb__content-type">
            {{{ read 'components/tag-page/media/listen.svg' }}}
          </span>
        {{/if}}
        <span class="thumb__datetime-posted">
          {{#if (isPublished24HrsAgo feedItem.date) }}
            {{{ hrsOnlyTimestamp feedItem.date }}}
          {{else}}
            {{ formatLocalDate feedItem.date 'MMMM D, YYYY' }}
          {{/if}}
        </span>
      </div>
      <div class="link__info">
        <span class="info__headline">{{{ feedItem.primaryHeadline }}}</span>
        <span class="info__teaser">{{{ feedItem.teaser }}}</span>
        <span class="info__datetime-posted">
          {{#if (isPublished24HrsAgo feedItem.date) }}
            {{{ hrsOnlyTimestamp feedItem.date }}}
          {{else}}
            {{ formatLocalDate feedItem.date 'MMMM D, YYYY' }}
          {{/if}}
        </span>
      </div>
    </a>
  </li>`) };

class LoadMoreContent {
  constructor(el) {
    this.loadMore = el;
    this.moreContentUrl = el.getAttribute('data-load-more-uri').replace(/^.*\.com/, '');
    this.moreContentUrlParam = el.getAttribute('data-load-more-param').replace(/^.*\.com/, '');
    this.currentPage = 1;
    this.template = templates[this.moreContentUrl.split('/')[2]];

    // load another page every time the load more button is clicked!
    this.loadMore.onclick = this.handleLoadMoreContent.bind(this);
  }

  /**
   * Click handler for the "load more" button.
   * Pulls down N more articles from the API and renders them.
   *
   */
  handleLoadMoreContent() {
    fetch(`${this.moreContentUrl}?page=${this.currentPage++}&${this.moreContentUrlParam}`)
      .then((response) => response.json())
      .then((data) => {
        for (let feedItem of data.content) {
          const wrapper = document.createElement('div');

          data.feedItem = feedItem;
          this.loadMore.before(wrapper);
          wrapper.outerHTML = this.template(data);
        }
        if (!data.moreContent) {
          this.loadMore.parentNode.removeChild(this.loadMore);
        }
      });
  }
}

module.exports = el => new LoadMoreContent(el);
