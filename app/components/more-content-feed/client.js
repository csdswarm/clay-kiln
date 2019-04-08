'use strict';
const { fetchDOM } = require('../../services/client/radioApi');

class MoreContentFeed {
  constructor(el) {
    this.moreContentFeed = el;
    this.loadMore = el.querySelector('.links__link--loadmore');
    this.moreContentUrl = '//' + this.moreContentFeed.getAttribute('data-uri').replace('@published', '') + '.html';

    this.currentPage = 1;
    this.tag = '';
    this.author = '';

    // load another page every time the load more button is clicked!
    if (this.loadMore) {
      this.loadMore.onclick = this.handleLoadMoreContent.bind(this);
      if (this.loadMore.getAttribute('data-tag')) {
        this.tag = this.loadMore.getAttribute('data-tag') || '';
      } else if (this.loadMore.getAttribute('data-author')) {
        this.author = this.loadMore.getAttribute('data-author') || '';
      }
      if (this.loadMore.getAttribute('data-section')) {
        this.sectionFront = this.loadMore.getAttribute('data-section') || '';
      }
    }
  }

  /**
   * Click handler for the "load more" button.
   * Pulls down N more articles from the API and renders them.
   *
   */
  async handleLoadMoreContent() {
    let moreContentUrl = `${this.moreContentUrl}?page=${this.currentPage++}`;

    if (this.tag) {
      moreContentUrl += `&tag=${this.tag}`;
    } else if (this.author) {
      moreContentUrl += `&author=${this.author}`;
    }
    if (this.sectionFront) {
      moreContentUrl += `&sectionFront=${this.sectionFront}`;
    }

    const links = await fetchDOM(moreContentUrl) ;

    // Remove the load more button as it's included in the returned result
    this.loadMore.parentNode.removeChild(this.loadMore);

    // Append to the list
    this.moreContentFeed.querySelector('ul').append(links);
    // iOS doesn't play nice with srcset dynamically (https://github.com/metafizzy/infinite-scroll/issues/770)
    if (/iPhone/.test(navigator.userAgent)) {
      this.moreContentFeed.querySelectorAll('img').forEach((img) => {
        if (!img.height) {
          img.outerHTML = img.outerHTML;
        }
      });
    }

    // Recreate the listener for the new button
    this.loadMore = this.moreContentFeed.querySelector('.links__link--loadmore');
    if (this.loadMore) {
      this.loadMore.onclick = this.handleLoadMoreContent.bind(this);
    }
  }
};

module.exports = el => new MoreContentFeed(el);

