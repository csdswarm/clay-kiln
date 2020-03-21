'use strict';

// not going to be able to do this directly on the instance
// left and right will control the direction -1 and +1
// that will set the active index number
// the active index slide will get a class that will have left: 0
// setting left or right will also set the directional class on the sliders container
// which will set the left to be neg or pos 100%
// once the active slide is in place the one below it should have the active class removed
// which will return it to the outside of the slides carousel's view window

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
  activeSlideModifierName = '--active';

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
    if (this.slideIndex > this.numSlides) {
      this.slideIndex = 0;
    }
    console.log('[slideIndex]', this.slideIndex);
  }
  getPreviousIndex() {
    let previousIndex;

    if (this.slideIndex === 0) {
      previousIndex = this.numSlides - 1;
    } else {
      previousIndex = this.slideIndex - 1;
    }

    return previousIndex;
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
  }
  setDirectionalClassName(carouselDirectionalObject) {
    for (const key in carouselDirectionalObjects) {
      if (carouselDirectionalObjects.hasOwnProperty(key)) {
        this.slidesContainer.classList.remove(carouselDirectionalObjects[key].className);
      }
    }
    this.slidesContainer.classList.add(carouselDirectionalObject.className);
  }
  onClickDirectionButton(carouselDirectionalObject) {
    // console.log('[carouselDirectionalObject]', carouselDirectionalObject);
    this.setDirectionalClassName(carouselDirectionalObject);
    // add the active class to the slide by the index
    this.slideElements[this.ctrl.model.slideIndex]
      .classList.add(`${componentClassName}__slide${activeSlideModifierName}`);
    // remove the active on the previous slide
    setTimeout(() => {
      this.slideElements[this.ctrl.model.getPreviousIndex()]
        .classList.remove(`${componentClassName}__slide${activeSlideModifierName}`);
    }, 200);
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
