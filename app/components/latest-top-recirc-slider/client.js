'use strict';
const Hammer = require('hammerjs');

/**
 * class handles all the view related props and methods associated with the
 * Slider class and should be instantiated on mount within the Slider
 * @class
 */
class SliderDom {
  constructor(containerEl) {
    // this object contains all the element references and util methods in working with those dom elements
    this.dom = {
      el: containerEl,
      btns: {
        left: containerEl.querySelector('.latest-top-recirc-slider__control--left'),
        right: containerEl.querySelector('.latest-top-recirc-slider__control--right'),
        canMoveRight: true,
        canMoveLeft: false,
        disabledOpacity: 0.35
      },
      itemsContainer: {
        el: containerEl.querySelector('.latest-top-recirc-slider__items-container'),
        x: 0,
        getViewWidth: () => this.dom.itemsContainer.el.offsetWidth,
        getSlides: () => Array.from(this.dom.itemsContainer.el.children),
        getSingleSlideWidth: () => this.dom.itemsContainer.el.children[0].offsetWidth,
        getTotalWidthOfSlides: () => this.dom.itemsContainer.getSlides().reduce((p, c) => p += c.offsetWidth, 0),
        getInitialOffset: () => this.dom.itemsContainer.getSingleSlideWidth() - this.dom.itemsContainer.getViewWidth() % this.dom.itemsContainer.getSingleSlideWidth(),
        getMaxX: () => this.dom.itemsContainer.getTotalWidthOfSlides() - this.dom.itemsContainer.getViewWidth()
      },
      items: containerEl.querySelectorAll('.latest-top-recirc-slider__item-container')
    };
    this.setBtnsState();
  }
  setItemsContainerPosition(direction) {
    // short circuit if btn disabled
    if (
      (direction > 0 && !this.dom.btns.canMoveLeft) ||
      (direction < 0 && !this.dom.btns.canMoveRight)
    ) {
      return;
    }
    this.dom.itemsContainer.x += this.dom.itemsContainer.getSingleSlideWidth() * direction;
    this.dom.itemsContainer.el.style.transform = `translateX(${this.dom.itemsContainer.x}px)`;
    this.setBtnsState();
  }
  setBtnsState() {
    // this could probably be improved and made more efficient
    if (this.dom.itemsContainer.x < 0) {
      this.dom.btns.canMoveLeft = true;
      this.dom.btns.left.style.opacity = 1;
    } else if (this.dom.itemsContainer.x <= 0) {
      this.dom.btns.canMoveLeft = false;
      this.dom.btns.left.style.opacity = this.dom.btns.disabledOpacity;
    }

    if (this.dom.itemsContainer.x >= 0) {
      this.dom.btns.canMoveRight = true;
      this.dom.btns.right.style.opacity = 1;
    } else if (this.dom.itemsContainer.x <= -this.dom.itemsContainer.getMaxX()) {
      this.dom.btns.canMoveRight = false;
      this.dom.btns.right.style.opacity = this.dom.btns.disabledOpacity;
    }
  }

  onResize() {
    // window resize cb basically resets the items container and buttons UI state
    this.dom.itemsContainer.x = 0;
    this.dom.itemsContainer.el.style.transform = `translateX(${this.dom.itemsContainer.x}px)`;
    this.setBtnsState();
  }
}

/**
 * main class for the latest recirc top slider handles initialization on mount and dismount
 * also handles all listeners
 * @class
 */
class Slider {
  constructor() {
    // bind the event listener methods do this context for removal on dismount
    this.onClick = this.onClick.bind(this);
    this.onResize = this.onResize.bind(this);
    // add the Vue mounting listeners
    document.addEventListener('latest-top-recirc-slider-mount', e => this.onMount(e));
    document.addEventListener('latest-top-recirc-slider-dismount', e => this.onDismount(e));
  }

  onMount() {
    // instantiate new SliderDom class and add local listeners now that Vue has mounted the component
    this.sd = new SliderDom(document.querySelector('.latest-top-recirc-slider'));
    this.sd.dom.el.addEventListener('click', this.onClick);
    window.addEventListener('resize', this.onResize);
    // hammer time
    this.hammer = new Hammer(this.sd.dom.itemsContainer.el);
    this.hammer.on('swipeleft swiperight', (ev) => {
      if (ev.type === 'swipeleft') {
        this.moveRight();
      }
      if (ev.type === 'swiperight') {
        this.moveLeft();
      }
    });
  }

  onDismount() {
    // remove the local listeners once Vue dismounts
    this.sd.dom.el.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.onResize);
    this.hammer.off('swipeleft swiperight', this.sd.dom.itemsContainer.el);
  }

  onClick(e) {
    if (e.target === this.sd.dom.btns.right) {
      this.moveRight();
    }
    if (e.target === this.sd.dom.btns.left) {
      this.moveLeft();
    }
  }

  onResize() {
    this.sd.onResize();
  }

  moveLeft() {
    this.sd.setItemsContainerPosition(1);
  }

  moveRight() {
    this.sd.setItemsContainerPosition(-1);
  }
}

module.exports = el => new Slider(el);
