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
   * mount the component get the headline and breadcrumb elements
   * find the right rail make it visible and add the height offset
   * of the headline and breadcrumb elements
   */
  onMount() {
    this.headlineElement = this.componentElement.querySelector('.event__headline');
    this.breadcrumbsElement = this.componentElement.querySelector('.component--breadcrumbs');
    this.rightRailElement = document.querySelector('.content__sidebar');
    // if any element refs are missing log error and short circuit
    if (!this.headlineElement || !this.breadcrumbsElement || !this.rightRailElement) {
      console.error('EventPage - can\'t find the necessary elements to continue.');
      return;
    }
    this.makeRightRailVisible();
    this.addHeightOffsetToRightRail(
      this.getComputedHeightsOfBreadcrumbsAndHeadline()
    );
  }
  /**
   * remove the listeners
   */
  onDismount() {
    document.removeEventListener('event-mount', this.onMount);
    document.removeEventListener('event-dismount', this.onDismount);
  }

  /**
   * get the element heights including the margins
   * @return {number}
   */
  getComputedHeightsOfBreadcrumbsAndHeadline() {
    let totalHeight = 0;

    totalHeight += this.breadcrumbsElement.clientHeight;
    totalHeight += this.headlineElement.clientHeight;
    // needed for margin heights
    totalHeight += parseInt(window.getComputedStyle(this.breadcrumbsElement).getPropertyValue('margin-bottom'));
    totalHeight += parseInt(window.getComputedStyle(this.headlineElement).getPropertyValue('margin-bottom'));

    return totalHeight;
  }
  /**
   * make the right rail visible if found
   */
  makeRightRailVisible() {
    this.rightRailElement.style.visibility = 'visible';
  }
  /**
   * add the offset height to the right rail if its set
   * @param {number} totalHeightOffset
   */
  addHeightOffsetToRightRail(totalHeightOffset) {
    this.rightRailElement.style.paddingTop = `${totalHeightOffset}px`;
  }
}
module.exports = (el) => new EventPage(el);
