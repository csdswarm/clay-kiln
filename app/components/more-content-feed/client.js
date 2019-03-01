'use strict';

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
  handleLoadMoreContent() {
    let moreContentUrl = `${this.moreContentUrl}?ignore_resolve_media=true&page=${this.currentPage++}`;

    if (this.tag) {
      moreContentUrl += `&tag=${this.tag}`;
    } else if (this.author) {
      moreContentUrl += `&author=${this.author}`;
    }
    if (this.sectionFront) {
      moreContentUrl += `&sectionFront=${this.sectionFront}`;
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
          let anchor = link.querySelector('a');

          if (anchor) {
            anchor.classList.add('spa-link');

            // Attach vue router listener on SPA links.
            anchor.addEventListener('click', event => {
              this.onSpaLinkClick(event, anchor);
            });
          }

          this.moreContentFeed.querySelector('ul').append(link);
        }

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
        this.loadMore.onclick = this.handleLoadMoreContent.bind(this);
      });
  }

  onSpaLinkClick(event, element) {
    event.preventDefault();
    element.removeEventListener('click', element.fn, false);

    const linkParts = new URL(element.getAttribute('href'));

    // eslint-disable-next-line no-undef
    vueApp._router.push(linkParts.pathname || '/');
  }
};

module.exports = el => new MoreContentFeed(el);
