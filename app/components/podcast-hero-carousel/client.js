'use strict';

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
  slideTransitionTime = 600;

class PodcastHeroCarouselModel {
  constructor(controller) {
    this.ctrl = controller;
    this.slideIndex = 0;
    this.numSlides = this.ctrl.view.slideElements.length;
  }
  setSlideIndex(value) {
    this.slideIndex += value;
    if (this.slideIndex < 0) {
      this.slideIndex = this.numSlides - 1;
    }
    if (this.slideIndex > this.numSlides - 1) {
      this.slideIndex = 0;
    }
    console.log('[slideIndex]', this.slideIndex);
  }
  onClickDirectionButton(carouselDirectionalObject) {
    this.setSlideIndex(carouselDirectionalObject.value);
  }
}
class PodcastHeroCarouselView {
  constructor(controller, el) {
    this.ctrl = controller;
    this.el = el;
    this.slidesContainer = this.el.querySelector(`.${componentClassName}__slides`);
    this.slideElements = this.el.querySelectorAll(`.${componentClassName}__slide`);
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
}

class PodcastHeroCarouselController {
  constructor(el) {
    this.onMount = this.onMount.bind(this);
    this.onDismount = this.onDismount.bind(this);
    this.onComponentClick = this.onComponentClick.bind(this);
    document.addEventListener('podcast-hero-carousel-mount', this.onMount);
    this.init(el);
  }
  init(el) {
    // instantiate model/view classes
    this.view = new PodcastHeroCarouselView(this, el);
    this.model = new PodcastHeroCarouselModel(this);
    // add listeners
    this.view.el.addEventListener('click', this.onComponentClick);
  }
  onComponentClick(e) {
    // console.log('[onComponentClick]', e.target);
    if (e.target.classList.contains(`${componentClassName}__control-button`)) {
      if (this.view.isAnimating) return;  // short-circuit if currently animating
      const carouselDirectionalObject = carouselDirectionalObjects[e.target.dataset.direction];

      this.view.onClickDirectionButton(carouselDirectionalObject);
      this.model.onClickDirectionButton(carouselDirectionalObject);
    }
  }
  onMount() {
    console.log('mounting PodcastHeroCarouselController');
  }
  onDismount() {
    document.removeEventListener('podcast-hero-carousel-mount', this.onMount);
    this.view.el.removeEventListener('click', this.onComponentClick);
  }
}
module.exports = (el) => new PodcastHeroCarouselController(el);
