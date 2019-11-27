'use strict';

const _bindAll = require('lodash/bindAll');

/**
 * class representing the dom elements and functionality of the LatestVideos class
 */
class LatestVideosViewController {
  /**
   * initialize the local dom.
   * @param {HTMLElement} componentEl - the component's el ref.
   */
  constructor(componentEl) {
    this.dom = {
      componentEl,
      rail: {
        el: componentEl.querySelector('.latest-videos__rail'),
        hasScrollListener: false,
        getItems: () => Array.from(this.dom.rail.el.querySelectorAll('.latest-videos__video')),
        getAllItemsHeight: () => this.dom.rail.getItems().reduce((p,c) => {
          return p += c.offsetHeight;
        }, 0)
      },
      railForeground: {
        el: componentEl.querySelector('.latest-videos__rail-foreground'),
        moreScrollClass: 'latest-videos__rail-foreground--scroll-down-more'
      }
    };
  }

  /**
   * method for scroll event
   */
  onRailScroll() {
    const gradHeightOffset = 45,
      scrollTop = this.dom.rail.el.scrollTop,
      maxHeight = this.dom.rail.getAllItemsHeight() - this.dom.rail.el.offsetHeight + gradHeightOffset,
      railForeground = this.dom.railForeground;

    if (scrollTop >= maxHeight) {
      railForeground.el.classList.remove(railForeground.moreScrollClass);
    } else {
      railForeground.el.classList.add(railForeground.moreScrollClass);
    }
  }
}

/**
 * class representing the LatestVideos component
 */
class LatestVideos {
  /**
   * Create a dot.
   * @param {HTMLElement} el - the component's el ref.
   */
  constructor(el) {
    this.el = el;
    _bindAll(this, ['onMount', 'onDismount', 'onScroll']);
    document.addEventListener('latest-videos-mount', this.onMount);
    document.addEventListener('latest-videos-dismount', this.onDismount);
  }

  /**
   * callback method for the component's mounting event
   */
  onMount() {
    this.vc = new LatestVideosViewController(this.el);
    const rail = this.vc.dom.rail;

    if (rail.el) {
      rail.el.addEventListener('scroll', this.onScroll);
      rail.hasScrollListener = true;
    }
  }

  /**
   * callback method for the component's dismounting event
   */
  onDismount() {
    const rail = this.vc.dom.rail;

    if (rail.hasScrollListener) {
      rail.el.removeEventListener('scroll', this.onScroll);
      rail.hasScrollListener = false;
    }
    document.removeEventListener('latest-videos-mount', this.onMount);
    document.removeEventListener('latest-videos-dismount', this.onDismount);
  }

  /**
   * callback method for the component's rail scroll event
   */
  onScroll() {
    this.vc.onRailScroll();
  }
}

module.exports = el => new LatestVideos(el);
