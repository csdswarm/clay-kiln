'use strict';

// not going to be able to do this directly on the instance
// left and right will control the direction -1 and +1
// that will set the active index number
// the active index slide will get a class that will have left: 0
// setting left or right will also set the directional class on the sliders container
// which will set the left to be neg or pos 100%
// once the active slide is in place the one below it should have the active class removed
// which will return it to the outside of the slides carousel's view window


class PodcastHeroCarouselController {
  constructor() {
    console.log('new PodcastHeroCarouselController');
    this.onMount = this.onMount.bind(this);
    this.onDismount = this.onDismount.bind(this);
    document.addEventListener('podcast-hero-carousel-mount', this.onMount);
  }

  onMount(e) {
    console.log('mount', e);
  }

  onDismount() {
    document.removeEventListener('podcast-hero-carousel-mount', this.onMount);
  }
}
module.exports = (el) => new PodcastHeroCarouselController(el);
