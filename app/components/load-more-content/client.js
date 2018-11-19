'use strict';

// @TODO ON-237 - move this file to more-content-feed

const helpers = require('../../services/universal/helpers'),
  Handlebars = require('handlebars');

for (const helper in helpers) {
  if (typeof helpers[helper] === 'function') {
    Handlebars.registerHelper(helper, helpers[helper]);
  }
}

// @TODO ON-237 - condense the handlebar template to a single template
// eslint-disable-next-line one-var
const ClayHandlebars = require('clayhandlebars')(Handlebars),
  template = ClayHandlebars.compile(`
  <li>
    <a class="links__link links__link--{{ feedItem.articleType }}" href="{{ feedItem.canonicalUrl }}"
       data-track-type="feedItem-link"
       data-track-component-name="more-content-feed"
       data-track-page-uri="{{ feedItem.pageUri }}"
       data-track-headline="{{ feedItem.primaryHeadline }}"
       data-track-component-title="More Content Feed"
       data-track-sectionFront="{{ feedItem.articleType }}">
      <div class="thumb__container">
        {{#if feedItem.articleType}}
          {{#ifAny (compare ../populateFrom 'all') feedItem.showTag}}
            <span class="thumb__section-tag">{{{ feedItem.articleType }}}</span>
          {{/ifAny}}
        {{/if}}
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
        <img
          src="{{ feedItem.feedImgUrl }}?width=300&crop=16:9,smart"
          srcset="{{ feedItem.feedImgUrl }}?width=300&crop=16:9,smart 300w,
                      {{ feedItem.feedImgUrl }}?width=320&crop=16:9,smart 320w,
                      {{ feedItem.feedImgUrl }}?width=343&crop=16:9,smart 343w,
                      {{ feedItem.feedImgUrl }}?width=380&crop=16:9,smart 380w,
                      {{ feedItem.feedImgUrl }}?width=440&crop=16:9,smart 440w"
          sizes="(max-width: 360px) 320px, (max-width: 480px) 440px, (max-width: 1023px) 343px, (max-width: 1279px) 300px, 380px"
          class="link__thumb" />
      </div>
      <div class="link__info">
        <div class="link__header">
          <span class="info__headline">{{{ feedItem.primaryHeadline }}}</span>
          <span class="info__teaser">{{{ feedItem.teaser }}}</span>
        </div>
        <div class="info__datetime-posted">
          {{#if (isPublished24HrsAgo feedItem.date) }}
            {{{ hrsOnlyTimestamp feedItem.date }}}
          {{else}}
            {{ formatLocalDate feedItem.date 'MMMM D, YYYY' }}
          {{/if}}
        </div>
      </div>
    </a>
  </li>`);

class LoadMoreContent {
  constructor(el) {
    this.li = el.parentNode;
    this.ul = this.li.parentNode;
    this.moreContentUrl = el.getAttribute('data-load-more-uri').replace(/^.*\.com/, '');
    this.moreContentUrlParam = el.getAttribute('data-load-more-param');
    this.currentPage = 1;
    this.template = template;
    this.showTag = this.moreContentUrl.split('/')[2] === 'tag-page';

    // load another page every time the load more button is clicked!
    el.onclick = this.handleLoadMoreContent.bind(this);
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
          const ul = document.createElement('ul');

          feedItem.showTag = this.showTag;
          data.feedItem = feedItem;

          ul.innerHTML = this.template(data);
          this.ul.insertBefore(ul.querySelector('li'), this.li);
        }
        if (!data.moreContent) {
          this.ul.removeChild(this.li);
        }
      });
  }
}

module.exports = el => new LoadMoreContent(el);
