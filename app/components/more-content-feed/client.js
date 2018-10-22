'use strict';

const  Handlebars = require('handlebars'),
  itemTemplate = `
   <li>
       <a class="links__link links__link--{{ feedItem.articleType }}" href="{{ feedItem.canonicalUrl }}"
          data-track-type="feedItem-link"
          data-track-component-name="more-content-feed"
          data-track-page-uri="{{ feedItem.pageUri }}"
          data-track-headline="{{ feedItem.primaryHeadline }}"
          data-track-component-title="More Content Feed"
          data-track-sectionFront="{{ feedItem.articleType }}">
        <div class="link__thumb" style="background-image:url({{ feedItem.feedImgUrl }});">
           {{#if (compare populateFrom 'all')}}
             <span class="thumb__section-front">{{{ feedItem.articleType }}}</span>
           {{/if}}
           {{#unless (compare locationOfContentFeed 'homepage') }}
             <span class="thumb__content-type">
               {{#ifAny (compare feedItem.lead 'youtube') (compare feedItem.lead 'brightcove')}}
                 {{{ read 'components/more-content-feed/media/watch.svg' }}}
               {{/ifAny}}
               {{#if (compare feedItem.lead 'audio')}}
                 {{{ read 'components/more-content-feed/media/listen.svg' }}}
               {{/if}}
             </span>
           {{/unless}}
           <span class="thumb__datetime-posted">
             {{ formatLocalDate feedItem.date 'MMMM D, YYYY' }}
           </span>
         </div>
         <div class="link__info">
           <span class="info__headline">{{{ feedItem.primaryHeadline }}}</span>
           <span class="info__teaser">{{{ feedItem.teaser }}}</span>
           <span class="info__datetime-posted">
             {{ formatLocalDate feedItem.date 'MMMM D, YYYY' }}
           </span>
         </div>
       </a>
   </li>
`;

require('clayhandlebars')(Handlebars);

class MoreContentFeed {
  constructor(el) {
    this.moreContentFeed = el;
    this.loadMore = el.querySelector('.more-content-feed__loadmore');
    this.linksSection = el.querySelector('.more-content-feed__links');
    this.moreContentUrl = this.moreContentFeed.getAttribute('data-uri').replace(/^.*\.com/, '');

    this.currentPage = 1;

    // load another page every time the load more button is clicked!
    this.loadMore.onclick = this.handleLoadMoreContent.bind(this);
  }

  /**
   * Click handler for the "load more" button.
   * Pulls down N more articles from the API and renders them.
   *
   */
  handleLoadMoreContent() {
    const template = Handlebars.compile(itemTemplate);

    fetch(`${this.moreContentUrl}?page=${this.currentPage++}`)
      .then((response) => response.json())
      .then((data) => {
        for (let feedItem of data.rawQueryResults) {
          const wrapper = document.createElement('div');

          data.feedItem = feedItem;
          this.linksSection.appendChild(wrapper);
          wrapper.outerHTML = template(data);
        }
        if (!data.moreResults) {
          this.loadMore.parentNode.removeChild(this.loadMore);
        }
      });
  }

};

module.exports = el => new MoreContentFeed(el);

