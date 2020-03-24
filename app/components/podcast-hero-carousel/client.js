'use strict';

// TODO:
// cleanup / easy to read and dry
// js docs
// improve kiln view
// responsive css
// remove logs

const
  componentClassName = 'podcast-hero-carousel',
  carouselDirectionalObjects = {
    left: {
      value: -1,
      className: `${componentClassName}__slides--left`
    },
    right: {
      value: 1,
      className: `${componentClassName}__slides--right`
    }
  },
  activeSlideModifierName = '--active',
  activeMacroClassName = `${componentClassName}__macro-button${activeSlideModifierName}`,
  slideTransitionTime = 600;

class PodcastHeroCarouselTimer {
  constructor(step = 1000) {
    this.tick = this.tick.bind(this);
    this.seconds = 0;
    this.isPaused = false;
    this.step = step;
    this.subscription = {};
  }
  subscribe(seconds, cb) {
    this.subscription = {
      seconds,
      cb
    };
  }
  start() {
    this.tmr = setInterval(this.tick, this.step);
  }
  tick() {
    if (!this.isPaused) {
      this.seconds++;
      if (this.subscription.seconds === this.seconds) {
        this.subscription.cb(this.seconds);
        this.reset();
      }
      console.log('timer', this.seconds);
    }
  }
  reset() {
    this.seconds = 0;
  }
  pause() {
    this.isPaused = true;
  }
  play() {
    this.isPaused = false;
  }
}
class PodcastHeroCarouselModel {
  constructor(controller) {
    this.ctrl = controller;
    this.slideIndex = 0;
    this.numSlides = this.ctrl.view.slideElements.length;
  }
  setSlideIndex(value, overrideIndex) {
    if (overrideIndex || overrideIndex === 0) {
      this.slideIndex = overrideIndex;
      console.log('[slideIndex overrideIndex]', this.slideIndex);
      return;
    }
    this.slideIndex += value;
    if (this.slideIndex < 0) {
      this.slideIndex = this.numSlides - 1;
    }
    if (this.slideIndex > this.numSlides - 1) {
      this.slideIndex = 0;
    }
    console.log('[slideIndex]', this.slideIndex);
  }
  onClickDirectionButton(carouselDirectionalObject, overrideIndex) {
    this.setSlideIndex(carouselDirectionalObject.value, overrideIndex);
  }
}
class PodcastHeroCarouselView {
  constructor(controller, el) {
    this.ctrl = controller;
    this.el = el;
    this.slidesContainer = this.el.querySelector(`.${componentClassName}__slides`);
    this.slideElements = this.el.querySelectorAll(`.${componentClassName}__slide`);
    this.macroElements = this.el.querySelectorAll(`.${componentClassName}__macro-button`);
    this.directionalButtons = {
      left: this.el.querySelector(`.${componentClassName}__control-button--left`),
      right: this.el.querySelector(`.${componentClassName}__control-button--right`)
    };
    this.isAnimating = false;
  }
  setDirectionalClassName(carouselDirectionalObject) {
    if (carouselDirectionalObject.value === 1) {
      this.slidesContainer.classList.replace(carouselDirectionalObjects.left.className, carouselDirectionalObject.className);
    } else {
      this.slidesContainer.classList.replace(carouselDirectionalObjects.right.className, carouselDirectionalObject.className);
    }
  }
  onClickDirectionButton(carouselDirectionalObject) {
    this.isAnimating = true;
    const
      activeSlideClassName = `${componentClassName}__slide${activeSlideModifierName}`,
      currentActiveSlide = this.slidesContainer.querySelector(`.${activeSlideClassName}`);

    this.setDirectionalClassName(carouselDirectionalObject);
    // when switching the directional classes tokenList.replace seems to take longer and is not a promise so timeout is needed
    setTimeout(() => {
      currentActiveSlide.classList.add('zero-index'); // z-index to below the active;
      // add the active class to the slide by the index
      this.slideElements[this.ctrl.model.slideIndex]
        .classList.add(activeSlideClassName);
      // remove the active on the previous slide after the transition time from css
      setTimeout(() => {
        currentActiveSlide.classList.remove(activeSlideClassName, 'zero-index');
        this.isAnimating = false;
      }, slideTransitionTime + 10);
    }, 10);
  }
  setActiveMacro(newSlideIndex) {
    const
      activeMacroElement = this.el.querySelector(`.${activeMacroClassName}`);

    activeMacroElement.classList.remove(activeMacroClassName);
    this.macroElements[newSlideIndex].classList.add(activeMacroClassName);
  }
}

class PodcastHeroCarouselController {
  constructor(el) {
    this.onMount = this.onMount.bind(this);
    this.onDismount = this.onDismount.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onComponentClick = this.onComponentClick.bind(this);
    // instantiate model/view classes
    this.view = new PodcastHeroCarouselView(this, el);
    this.model = new PodcastHeroCarouselModel(this);
    this.timer = new PodcastHeroCarouselTimer();
    document.addEventListener('podcast-hero-carousel-mount', this.onMount);
  }
  init() {
    // add listeners
    this.view.el.addEventListener('click', this.onComponentClick);
    this.view.el.addEventListener('mouseenter', this.onMouseEnter);
    this.view.el.addEventListener('mouseleave', this.onMouseLeave);
    // start timer
    this.timer.start();
    this.timer.subscribe(8, () => this.view.directionalButtons.right.click());
  }
  onComponentClick(e) {
    // directional buttons
    if (e.target.classList.contains(`${componentClassName}__control-button`)) {
      if (this.view.isAnimating) return;  // short-circuit if currently animating
      const carouselDirectionalObject = carouselDirectionalObjects[e.target.dataset.direction];

      this.view.onClickDirectionButton(carouselDirectionalObject);
      this.model.onClickDirectionButton(carouselDirectionalObject);
      this.view.setActiveMacro(this.model.slideIndex);
    }
    // macro (dots) click
    if (e.target.classList.contains(`${componentClassName}__macro-button`)) {
      if (this.view.isAnimating) return;  // short-circuit if currently animating
      const
        newSlideIndex = parseInt(e.target.dataset.slideIndex),
        carouselDirectionalObject = carouselDirectionalObjects[
          newSlideIndex < this.model.slideIndex ? 'left' : 'right'
        ];

      if (newSlideIndex === this.model.slideIndex) return;  // short-circuit if same as current slide
      this.model.onClickDirectionButton(carouselDirectionalObject, newSlideIndex);
      this.view.onClickDirectionButton(carouselDirectionalObject);
      this.view.setActiveMacro(newSlideIndex);
    }
  }
  onMouseEnter() {
    console.log('[onMouseEnter]');
    this.timer.pause();
  }
  onMouseLeave() {
    console.log('[onMouseLeave]');
    this.timer.reset();
    this.timer.play();
  }
  onMount(el) {
    console.log('mounting PodcastHeroCarouselController');
    this.init(el);
  }
  onDismount() {
    document.removeEventListener('podcast-hero-carousel-mount', this.onMount);
    this.view.el.removeEventListener('click', this.onComponentClick);
    this.view.el.removeEventListener('mouseenter', this.onComponentClick);
    this.view.el.removeEventListener('mouseleave', this.onComponentClick);
  }
}
module.exports = (el) => new PodcastHeroCarouselController(el);
