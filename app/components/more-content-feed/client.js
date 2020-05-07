'use strict';
const { fetchDOM } = require('../../services/client/radioApi'),
  safari = require('../../services/client/safari'),
  visibility = require('../../services/client/visibility');

class MoreContentFeed {
  constructor(el) {
    this.moreContentFeed = el;
    this.loadMore = el.querySelector('.links__link--loadmore');
    this.moreContentUrl = '//' + this.moreContentFeed.getAttribute('data-uri').replace('@published', '') + '.html';
    this.maxLazyLoadedPages = parseInt(this.moreContentFeed.getAttribute('data-lazy-loads'), 10);
    this.currentPage = 1;
    this.tag = '';
    this.author = '';
    this.lazyLoadEvent = new CustomEvent('content-feed-lazy-load');

    // load another page every time the load more button is clicked!
    if (this.loadMore) {
      this.setupLazyLoad();

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
   * Handle lazy loading logic
   * Setup scroll listener on loadMore element
   * Call handleLoadMoreContent
   * Stop once it has lazy loaded enough pages
   */
  setupLazyLoad() {
    if (this.currentPage > this.maxLazyLoadedPages) {
      return;
    }

    this.loadMoreVisibility = new visibility.Visible(this.loadMore, { shownThreshold: 0.05 });
    this.loadMore.style.visibility = 'hidden';
    this.loadMoreVisibility.on('shown', async () => {
      this.loadMoreVisibility.destroy();
      await this.handleLoadMoreContent();
      document.dispatchEvent(this.lazyLoadEvent);
      this.setupLazyLoad();
    });
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

    const links = await fetchDOM(moreContentUrl, { shouldDedupeContent: true }) ;

    // Remove the load more button as it's included in the returned result
    this.loadMore.parentNode.removeChild(this.loadMore);

    // Append to the list
    this.moreContentFeed.querySelector('ul').append(links);
    safari.fixAJAXImages(this.moreContentFeed);

    // Recreate the listener for the new button
    this.loadMore = this.moreContentFeed.querySelector('.links__link--loadmore');
    if (this.loadMore) {
      this.loadMore.onclick = this.handleLoadMoreContent.bind(this);
    }
  }
};

module.exports = el => new MoreContentFeed(el);
