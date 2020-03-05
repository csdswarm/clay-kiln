'use strict';

class EventPage {
  /**
   * Component's JS Class
   * @param {HTMLElement} componentElement
   */
  constructor(componentElement) {
    this.onMount = this.onMount.bind(this);
    this.onDismount = this.onDismount.bind(this);
    this.componentElement = componentElement;

    document.addEventListener('event-mount', this.onMount);
    document.addEventListener('event-dismount', this.onDismount);
  }

  /**
   * mount the component
   * find the right rail make it visible
   */
  onMount() {
    this.rightRailElement = document.querySelector('.content__sidebar');
    // if any element refs are missing log error and short circuit
    if (this.rightRailElement) {
      this.makeRightRailVisible();;
    }
  }
  /**
   * remove the listeners
   */
  onDismount() {
    document.removeEventListener('event-mount', this.onMount);
    document.removeEventListener('event-dismount', this.onDismount);
  }
  /**
   * make the right rail visible if found
   */
  makeRightRailVisible() {
    this.rightRailElement.style.visibility = 'visible';
  }
}
module.exports = (el) => new EventPage(el);
