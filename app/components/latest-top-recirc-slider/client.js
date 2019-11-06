'use strict';
const Hammer = require('hammerjs');

/**
 * class handles all the view related props and methods associated with the
 * Slider class and should be instantiated on mount within the Slider
 */
class SliderDom {
  /**
   * Create a slider view.
   * @param {HTMLElement} containerEl - The html ref to the parent slider.
   */
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
        getMaxX: () => this.dom.itemsContainer.getTotalWidthOfSlides() - this.dom.itemsContainer.getViewWidth(),
        getSlidesVisible: () => this.dom.itemsContainer.getViewWidth() / this.dom.itemsContainer.getSingleSlideWidth(),
        getTotalClicksToTheRight: () => this.dom.itemsContainer.getSlides().length - this.dom.itemsContainer.getSlidesVisible()
      },
      items: containerEl.querySelectorAll('.latest-top-recirc-slider__item-container')
    };
    this._maxClicksRight = Math.round( this.dom.itemsContainer.getTotalClicksToTheRight() );
    this.setBtnsState();
  }
  set maxClicksRight(value) {
    this._maxClicksRight += value;
    if (this._maxClicksRight < 0) {
      this._maxClicksRight = 0;
    } else if (this._maxClicksRight > Math.round( this.dom.itemsContainer.getTotalClicksToTheRight() )) {
      this._maxClicksRight = Math.round( this.dom.itemsContainer.getTotalClicksToTheRight() );
    }
  }

  get maxClicksRight() {
    return this._maxClicksRight;
  }
  /**
   * Create a slider view.
   * @param {number} direction - -1 or 1.
   */
  setItemsContainerPosition(direction) {
    const slider = this,
      { btns: buttons, itemsContainer } = slider.dom;
    
    slider.maxClicksRight = direction;
    // short circuit if btn disabled
    if (
      (direction > 0 && !buttons.canMoveLeft) ||
      (direction < 0 && !buttons.canMoveRight)
    ) {
      return;
    }
    slider.setBtnsState();
    itemsContainer.x += itemsContainer.getSingleSlideWidth() * direction;
    itemsContainer.el.style.transform = `translateX(${itemsContainer.x}px)`;
    
  }
  setBtnsState() {
    const slider = this,
      { btns: buttons, itemsContainer } = slider.dom,
      { left: leftButton, right: rightButton } = buttons;

    // boundaries for clicking or swiping right
    if (this.maxClicksRight > 0) {
      buttons.canMoveRight = true;
      rightButton.style.opacity = 1;
    } else {
      buttons.canMoveRight = false;
      rightButton.style.opacity = buttons.disabledOpacity;
    }
    // boundaries for clicking or swiping left
    if (Math.round( itemsContainer.getTotalClicksToTheRight() ) - slider.maxClicksRight > 0) {
      buttons.canMoveLeft = true;
      leftButton.style.opacity = 1;
    } else {
      buttons.canMoveLeft = false;
      leftButton.style.opacity = buttons.disabledOpacity;
    }
  }

  onResize() {
    const slider = this,
      { itemsContainer } = slider.dom;
    
    // window resize cb basically resets the items container and buttons UI state
    itemsContainer.x = 0;
    itemsContainer.el.style.transform = `translateX(${itemsContainer.x}px)`;
    slider.setBtnsState();
    slider.maxClicksRight = Math.round( itemsContainer.getTotalClicksToTheRight() );
  }
}

/**
 * main class for the latest recirc top slider handles initialization on mount and dismount
 * also handles all listeners
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
    this.hammer.on('swipeleft swiperight', (event) => {
      if (event.type === 'swipeleft') {
        this.moveRight();
      }
      if (event.type === 'swiperight') {
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
