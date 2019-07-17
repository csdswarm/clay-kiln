'use strict';

const { DAY: BANNER_ALERT_CLOSE_PERIOD, SECOND } = require('../../services/universal/constants'),
  MESSAGE_CYCLE_DURATION = 5 * SECOND;
let _fadeCycleIntervalId, _hashIndex = 1;

/**
 * Checks cookies to see if user has closed a message already and returns
 * a list of element selectors matching each closed message
 * @returns {Array}
 */
function getSelectorsForClosedAlertsFromCookie() {
  const cookies = document.cookie,
    re = /atbr_(\w+)=1;/g,
    output = [];
  let found = re.exec(cookies);

  while (Array.isArray(found)) {
    output.push(`#alertBanner_${found[1]}`);
    found = re.exec(cookies);
  }
  return output;
}

/**
 * Clears the fade cycle interval if it exists
 */
function clearExistingIntervals() {
  _fadeCycleIntervalId && window.clearInterval(_fadeCycleIntervalId);
}

/**
 * Returns a date string for the period of time needed to keep a banner alert closed
 * @returns {string}
 */
function messageClosedPeriod() {
  return (new Date(Date.now() + BANNER_ALERT_CLOSE_PERIOD)).toUTCString();
}

/**
 * Removes the message element from the alert banner and removes the
 * alert banner if there are no messages left in it.
 * @param {HTMLElement} el The alert-banner element
 * @returns {Function} a function to remove the message element from the banner
 */
function removeBannerMessage(el) {
  return message => {
    el.removeChild(message);

    // If all messages are gone, remove the alert banner.
    if (!el.children.length) {
      el.parentElement.removeChild(el);
    }
  };
}

/**
 * Closes the alert banner when the user clicks its close button.
 * It also saves a cookie to remember not to show this again for a while
 * @param {HTMLElement} el The alert banner element
 * @param {HTMLElement} message The message element to close
 * @returns {Function}
 */
function closeAlert(el, message) {
  return () => {
    const cookieId = message.id.replace(/^alertBanner_/, 'atbr_');

    document.cookie = `${cookieId}=1; expires=${messageClosedPeriod()}; path=/`;

    removeBannerMessage(el)(message);
  };
}

/**
 * Switches which message is shown in the banner. If the number of messages falls below 2
 * (should only ever be between 0 and 2 messages), then turn off the interval cycle as it
 * is not needed.
 * @param {HTMLElement} el The alert-banner element
 * @returns {Function} The function that toggles or removes the class to show the secondary message
 */
function toggleSecondaryMessage(el) {
  return () => {
    if (el.children.length > 1) {
      el.classList.toggle('alert-banner--show-secondary');
    } else {
      el.classList.remove('alert-banner--show-secondary');
      clearExistingIntervals();
    }
  };
}

/**
 * Iterates over the child messages and checks to see if they are multiline and exceed the
 * size of their container. If so, it adds a class that will allow ellipses to be shown
 *
 * Why? Basically because CSS ellipses currently only work for single line boxes, however,
 * there is a requirement that we show multiple lines on smaller devices, but show ellipses
 * for content that goes over the maximum number of lines - CSD July, 2019
 * @param {HTMLElement} el The alert-banner element
 */
function handleOverflow(el) {
  for (const child of Array.from(el.querySelectorAll('.alert-banner__text') || [])) {
    const computedStyle = window.getComputedStyle(child),
      isMultiline = child.clientHeight >= 2 * parseInt(computedStyle.getPropertyValue('line-height')),
      contentOverflows = isMultiline && (child.clientHeight < child.scrollHeight);

    if (contentOverflows) {
      child.classList.add('alert-banner__text--overflows');
    } else {
      child.classList.remove('alert-banner__text--overflows');
    }
  }
}

/**
 * Sets the interval to fade any secondary banner messages into and out of view
 * @param {HTMLElement} el The alert-banner element
 */
function setMessageFadeCycle(el) {
  clearExistingIntervals();
  _fadeCycleIntervalId = setInterval(toggleSecondaryMessage(el), MESSAGE_CYCLE_DURATION);
}

/**
 * If any messages from the server match a local closed message cookie, remove it from
 * the message list
 * @param {HTMLElement} el The alert-banner element
 */
function removeClosedMessages(el) {
  const messageFoundInDOM = message => message,
    removeMessage = removeBannerMessage(el);

  getSelectorsForClosedAlertsFromCookie()
    .map(selector => el.querySelector(selector))
    .filter(messageFoundInDOM)
    .forEach(removeMessage);
}

/**
 * Attaches all close handlers to the X button of each banner message
 * @param {HTMLElement} el The alert-banner element
 */
function attachCloseHandlers(el) {
  el
    .querySelectorAll('.alert-banner__message')
    .forEach(message => {
      message
        .querySelector('.alert-banner__close-button')
        .addEventListener('click', closeAlert(el, message), { once: true });
    });
}

/**
 * Prepares the environment, configures events and binds all handlers needed for
 * banner alerts
 * @param {HTMLElement | {hashIndex:(number|undefined)}} el The alert-banner element
 */
function setupAlertBannerClientFunctionality(el) {

  if (el.hashIndex) return;

  el.hashIndex = _hashIndex++; // to prevent potential double entries

  handleOverflow(el);
  window.addEventListener('resize', () => handleOverflow(el));

  setMessageFadeCycle(el);
  removeClosedMessages(el);
  attachCloseHandlers(el);

}

module.exports = setupAlertBannerClientFunctionality;
