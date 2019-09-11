'use strict';

class Slider {
    constructor(el) {
        const controls = el.querySelector('.latest-top-recirc-slider__controls-container');
        controls.addEventListener('click', e => this.onControlsClick(e));
        console.log('[Slider constructor el]', el);
    }
    onControlsClick(e) {
        console.log('[e]', e.currentTarget);
    }
}
console.log(new Slider('foo'));

module.exports = el => new Slider(el);