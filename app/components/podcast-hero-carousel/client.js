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
  activeMacroClassName = `${componentClassName}__macro-button${activeSlideModifierName}`,
  slideTransitionTime = 600,
  timerStepInterval = 1000;



/**
 * Create a new timer that the component will use to automate slide progressions
 *
 * Call subscribe to clear upon dismount
 * Call unsubscribe to clear upon dismount
 * @class
 */
class PodcastHeroCarouselTimer {
  /**
   * Create a timer.
   * @param {number} step - the milliseconds for when each step is fired.
   */
  constructor(step = timerStepInterval) {
    this.tick = this.tick.bind(this);
    this.stepsPassed = 0;
    this.isPaused = false;
    this.step = step;
    this.subscription = {};
  }

  /**
   *
   * Subscribe to the timer.
   * @param {number} threshold - The amount of seconds between each callback
   * @param {Function} cb - The callback fired when seconds is reached.
   */
  subscribe(threshold, cb) {
    this.subscription = {
      threshold,
      cb
    };
  }

  /**
   * Start the timer.
   */
  start() {
    this.tmr = setInterval(this.tick, this.step);
  }

  /**
   * Fired each step.
   */
  tick() {
    if (!this.isPaused) {
      this.stepsPassed++;
      if (this.subscription.threshold === this.stepsPassed) {
        this.subscription.cb();
        this.reset();
      }
    }
  }

  /**
   * Reset the timer.
   */
  reset() {
    this.stepsPassed = 0;
  }

  /**
   * Pause the timer.
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Play the timer.
   */
  play() {
    this.isPaused = false;
  }

  /**
   * Unsubscribe the timer.
   */
  unsubscribe() {
    clearInterval(this.tmr);
  }
}



/**
 * A model for the component
 *
 * @class
 */
class PodcastHeroCarouselModel {
  /**
   * Create a carousel model.
   * @param {PodcastHeroCarouselController} controller - the component's controller.
   */
  constructor(controller) {
    this.ctrl = controller;
    this.slideIndex = 0;
    this.numSlides = this.ctrl.view.slideElements.length;
  }

  /**
   * Set the slide index with the value of the aCarouselDirectionalObject.
   * @param {number} value - the new value (-1,+1) for the slide index
   * @param {number} overrideIndex - index can be explicitly set
   */
  setSlideIndex(value, overrideIndex) {
    if (overrideIndex || overrideIndex === 0) {
      this.slideIndex = overrideIndex;
      return;
    }
    this.slideIndex += value;
    if (this.slideIndex < 0) {
      this.slideIndex = this.numSlides - 1;
    }
    if (this.slideIndex > this.numSlides - 1) {
      this.slideIndex = 0;
    }
  }

  /**
   * Model method for clicking on the component.
   * @param {aCarouselDirectionalObject} aCarouselDirectionalObject - the new aCarouselDirectionalObject
   * @param {number} overrideIndex - index can be explicitly set
   */
  onClickDirectionButton(aCarouselDirectionalObject, overrideIndex) {
    this.setSlideIndex(aCarouselDirectionalObject.value, overrideIndex);
  }
}



/**
 * A view for the component
 *
 * @class
 */
class PodcastHeroCarouselView {
  /**
   * Create a carousel view.
   * @param {PodcastHeroCarouselController} controller - the component's controller.
   * @param {HTMLElement} el - the component's containing html element.
   */
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

  /**
   * View method for setting the corresponding directional class on the slides container
   * @param {aCarouselDirectionalObject} aCarouselDirectionalObject - the new aCarouselDirectionalObject
   */
  setDirectionalClassName(aCarouselDirectionalObject) {
    if (aCarouselDirectionalObject.value === 1) {
      this.slidesContainer.classList.replace(carouselDirectionalObjects.left.className, aCarouselDirectionalObject.className);
    } else {
      this.slidesContainer.classList.replace(carouselDirectionalObjects.right.className, aCarouselDirectionalObject.className);
    }
  }

  /**
   * View method for logic fired on clicking the directional buttons
   * @param {aCarouselDirectionalObject} aCarouselDirectionalObject - the new aCarouselDirectionalObject
   */
  onClickDirectionButton(aCarouselDirectionalObject) {
    this.isAnimating = true;
    const
      activeSlideClassName = `${componentClassName}__slide${activeSlideModifierName}`,
      currentActiveSlide = this.slidesContainer.querySelector(`.${activeSlideClassName}`);

    this.setDirectionalClassName(aCarouselDirectionalObject);
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

  /**
   * View method for changing which macro dot is active
   * @param {number} newSlideIndex - the index number of the new slide
   */
  setActiveMacro(newSlideIndex) {
    const
      activeMacroElement = this.el.querySelector(`.${activeMacroClassName}`);

    activeMacroElement.classList.remove(activeMacroClassName);
    this.macroElements[newSlideIndex].classList.add(activeMacroClassName);
  }
}
/**
 * Create a new controller for the component
 *
 * @class
 */
class PodcastHeroCarouselController {
  /**
   * Create a carousel controller.
   * @param {HTMLElement} el - the component's containing html element.
   */
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
    document.addEventListener('podcast-hero-carousel-dismount', this.onDismount);
  }

  /**
   * Controller method for clicking on the component and determining which elements were clicked
   * and the corresponding logic.
   * @param {Event} e - the event object
   */
  onComponentClick(e) {
    // directional buttons
    if (e.target.classList.contains(`${componentClassName}__control-button`)) {
      if (this.view.isAnimating) return;  // short-circuit if currently animating
      const aCarouselDirectionalObject = carouselDirectionalObjects[e.target.dataset.direction];

      this.view.onClickDirectionButton(aCarouselDirectionalObject);
      this.model.onClickDirectionButton(aCarouselDirectionalObject);
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

  /**
   * Controller method for when the user's mouse enters the component
   */
  onMouseEnter() {
    this.timer.pause();
  }

  /**
   * Controller method for when the user's mouse leaves the component
   */
  onMouseLeave() {
    this.timer.reset();
    this.timer.play();
  }

  /**
   * Controller method fired when the spa mounts the components
   */
  onMount() {
    if (this.view.slideElements.length < 2) {
      // 1 or fewer slides short circuit
      return;
    }
    // add listeners
    this.view.el.addEventListener('click', this.onComponentClick);
    this.view.el.addEventListener('mouseenter', this.onMouseEnter);
    this.view.el.addEventListener('mouseleave', this.onMouseLeave);
    // start timer
    this.timer.start();
    this.timer.subscribe(8, () => this.view.directionalButtons.right.click());
  }

  /**
   * Controller method fired when the spa dismounts the components
   */
  onDismount() {
    if (this.view.slideElements.length < 2) {
      // 1 or fewer slides short circuit
      return;
    }
    document.removeEventListener('podcast-hero-carousel-mount', this.onMount);
    document.removeEventListener('podcast-hero-carousel-dismount', this.onDismount);
    this.view.el.removeEventListener('click', this.onComponentClick);
    this.view.el.removeEventListener('mouseenter', this.onComponentClick);
    this.view.el.removeEventListener('mouseleave', this.onComponentClick);
    this.timer.unsubscribe();
  }
}

module.exports = (el) => new PodcastHeroCarouselController(el);
