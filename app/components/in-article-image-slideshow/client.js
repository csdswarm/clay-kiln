'use strict';

const dom = require('@nymag/dom');

DS.controller('in-article-image-slideshow', ['_', '$visibility', function (_, $visibility) {

  var hideArrow = 'hide-arrow',
    slideTransition = 'slide-transition',
    SHOWN_TRESHOLD = 0.05,
    visible;


  function Slideshow(el) {
    this.slides = dom.find(el, '.slides');
    this.slide = dom.findAll(el, '.in-article-image-slide');
    this.slideImage = dom.find(el, '.in-article-image-slide img');
    this.slideImageHeight = this.slideImage.height;
    this.numSlides = this.slide.length;
    this.slideContainer = dom.findAll(el, '.slide-container');
    this.currentSlide = 0;
    this.el = el,
    this.rightArrow = dom.find(el, '.right-arrow'),
    this.leftArrow = dom.find(el, '.left-arrow'),
    this.width;
    this.positionArrows();
    this.showArrows();
    this.debounceResizeHandler = _.debounce(this.resizeDebounced, 300);
    window.addEventListener('resize', this.resizeSlideShow.bind(this));
    window.addEventListener('scroll', this.slideshowInView.bind(this));
    this.intervalId = null;
    this.init();

    // If the first image has not yet loaded, reposition slideshow arrows after it fully loads
    this.slideImage.addEventListener('load', this.slowLoadImagesArrows.bind(this));

    this.setSlideCounter();
    this.initializeVisible();
    this.slideshowInView();

  }

  Slideshow.prototype = {
    events: {
      '.right-arrow click': 'slideRight',
      '.left-arrow click': 'slideLeft'
    },

    // check to see if an element has a particular class
    hasClass: function (el, cls) {
      return el.classList.contains(cls);
    },

    slowLoadImagesArrows: function () {
      this.positionArrows();
      this.showArrows();
    },

    init: function () {
      var i, containerEl, randomID;


      for (i = 0; i < this.slideContainer.length; i++) {
        containerEl = this.slideContainer[i];

        // add id to each slideshow
        randomID = Math.random().toString(36).substring(7);
        containerEl.setAttribute('id', 'container_' + randomID);
      }
    },

    initializeVisible: function () {
      visible = new $visibility.Visible(this.el, {
        shownThreshold: SHOWN_TRESHOLD
      });

      visible.on('shown', this.loadSlide.bind(this));

    },

    // this is to lazy load the slides in the slideshow

    loadSlide: function () {
      var slide = this.slide[this.currentSlide + 1],
        slideImage = dom.find(slide, '.slide-image'),
        imageSource = slideImage.dataset.imageSrc,
        imageSourceSet = slideImage.dataset.imageSrcSet;

      if (this.currentSlide + 1 <= this.numSlides && slideImage.dataset.imageSrc && slideImage.dataset.imageSrcSet) {

        slideImage.src = imageSource;
        slideImage.srcset = imageSourceSet;

        slideImage.removeAttribute('data-image-src');
        slideImage.removeAttribute('data-image-src-set');

        if (visible) visible.destroy();
      }
    },

    setSlideCounter: function () {
      var counter,
        totalSlides,
        i;

      for (i = 0; i < this.slide.length; i++) {
        counter = dom.find(this.slide[i], '.counter');
        totalSlides = dom.find(this.slide[i], '.total-slides');
        totalSlides.append(this.numSlides);
        counter.classList.remove('hide-counter');
      }
    },

    slideRight: function () {
      var dist;

      this.currentSlide += 1;
      this.width = this.slides.offsetWidth;
      dist = this.currentSlide * this.width;
      this.slides.setAttribute('style', 'transform: translateX(-' + dist + 'px)');
      this.showArrows();

      // lazy loading slides
      this.loadSlide();
    },

    slideLeft: function () {
      var dist;

      this.currentSlide -= 1;
      this.width = this.slides.offsetWidth;
      dist = this.currentSlide * this.width;
      this.slides.setAttribute('style', 'transform: translateX(-' + dist + 'px)');
      this.showArrows();
      this.slideNum --;
    },

    positionArrows: function () {
      this.rightArrow.style.top = (this.slideImageHeight - 45) / 2 + 'px';
      this.leftArrow.style.top = (this.slideImageHeight - 45) / 2 + 'px';
    },

    showArrows: function () {
      if (this.rightArrow.classList.contains(hideArrow)) {
        this.rightArrow.classList.remove(hideArrow);
      }
      if (this.leftArrow.classList.contains(hideArrow)) {
        this.leftArrow.classList.remove(hideArrow);
      }
      if (this.numSlides === 1) {
        this.rightArrow.classList.add(hideArrow);
        this.leftArrow.classList.add(hideArrow);
      } else if (this.currentSlide === 0 && this.numSlides >= 2) {
        this.leftArrow.classList.add(hideArrow);
      } else if (this.currentSlide === this.numSlides - 1 && this.numSlides >= 2) {
        this.rightArrow.classList.add(hideArrow);
      }
    },

    resizeDebounced: function () {
      var dist;

      this.slides.classList.remove(slideTransition);
      this.width = this.slides.offsetWidth;
      dist = this.currentSlide * this.width;
      this.slides.setAttribute('style', 'transform: translateX(-' + dist + 'px)');
      this.slideImageHeight = this.slideImage.height;
      this.positionArrows();
      this.slides.classList.add(slideTransition);
    },

    resizeSlideShow: function () {
      this.debounceResizeHandler();
    },

    // autoplay the slideshow once and reset to after all of the slides have cycled
    autoPlay: function () {
      if (this.currentSlide !== this.numSlides - 1) {
        this.slideRight();
      } else {
        // done, reset the slideshow
        this.slides.setAttribute('style', '');
        this.currentSlide = 0;
        this.showArrows();
        clearInterval(this.intervalId);
      }
    },

    // when the slideshow is in view autoplay it
    slideshowInView: function () {
      var windowPos = window.scrollY,
        slideTop,
        slideHeight,
        slideId, i;

      for (i = 0; i < this.slideContainer.length; i++) {
        slideId = this.slideContainer[i].getAttribute('id');
        slideTop = document.getElementById(slideId).offsetTop;
        slideHeight = document.getElementById(slideId).offsetHeight;

        if (this.hasClass(this.slideContainer[i], 'autoplay')) {
          if (windowPos >= slideTop && windowPos < slideTop + slideHeight) {
            if (!this.hasClass(document.getElementById(slideId), 'played')) {
              document.getElementById(slideId).classList.add('played');
              this.intervalId = setInterval(this.autoPlay.bind(this), 5000);
            }
          }
        }
      }
    }
  };

  return Slideshow;
}]);
