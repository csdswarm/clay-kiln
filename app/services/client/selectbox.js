'use strict';

const Selectr = require('mobius1-selectr');

/**
 * Wrapper for the current select box implementation.
 * With new requirements allowing mobile to use native, a better library should be used in the future.
 */
class Select {
  /**
   * create a new select box object
   *
   * @param {object} select
   * @param {object} options
   */
  constructor(select, options) {
    this.selectr = new Selectr(select, options);
  }
  /**
   * returns the value of the selected option
   *
   * @returns {string}
   */
  getValue() {
    return this.selectr.getValue();
  }
  /**
   * adds an event to the select box fixing issues with change firing multiple times
   *
   * @param {string} event
   * @param {function} func
   */
  addEventListener(event, func) {
    if (event === 'change') {
      this.onChange = func;

      func = this.wrapChange.bind(this);
    }

    this.selectr.on(`selectr.${event}`, func);
  }
  /**
   * wraps a function and only runs it if the value has changed
   *
   * @param {object} event
   */
  wrapChange(event) {
    if (this.currentValue !== event.value) {
      this.currentValue = event.value;
      this.onChange(event);
    }
  }
}

module.exports = Select;
