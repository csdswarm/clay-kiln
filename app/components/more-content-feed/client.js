'use strict';

class MoreContentFeed {
  constructor(el) {
    this.moreContentFeed = el;
    this.loadMore = el.querySelector('.links__link--loadmore');
    this.moreContentUrl = '//' + this.moreContentFeed.getAttribute('data-uri').replace('@published', '.html');

    this.currentPage = 1;
    this.tag = this.loadMore ? this.loadMore.getAttribute('data-tag') : '';

    // load another page every time the load more button is clicked!
    this.loadMore.onclick = this.handleLoadMoreContent.bind(this);
  }

  /**
   * Click handler for the "load more" button.
   * Pulls down N more articles from the API and renders them.
   *
   */
  handleLoadMoreContent(event) {
    event.preventDefault(); // Block default link event

    let moreContentUrl = `${this.moreContentUrl}?ignore-resolve-media=true&page=${this.currentPage++}`;

    if (this.tag) {
      moreContentUrl += `&tag=${this.tag}`;
    }

    fetch(moreContentUrl)
      .then((response) => response.text())
      .then((html) => {
        // Initialize the DOM parser
        const parser = new DOMParser(),
          doc = parser.parseFromString(html, 'text/html');

        // Remove the load more button as it's included in the returned result
        this.loadMore.parentNode.removeChild(this.loadMore);

        // Append to the list
        for (let link of doc.body.childNodes) {
          this.moreContentFeed.querySelector('ul').append(link);
        }

        // Recreate the listener for the new button
        this.loadMore = this.moreContentFeed.querySelector('.links__link--loadmore');
        this.loadMore.onclick = this.handleLoadMoreContent.bind(this);
      });
  }

};

module.exports = el => new MoreContentFeed(el);

