'use strict';

const { DAY: BANNER_ALERT_CLOSE_PERIOD, SECOND } = require('../../services/universal/constants'),
  MESSAGE_CYCLE_DURATION = 5 * SECOND;
let _fadeCycleIntervalId;


/**
 * Clears the fade cycle interval if it exists
 */
function clearExistingIntervals() {
  if (_fadeCycleIntervalId) {
    window.clearInterval(_fadeCycleIntervalId);
    _fadeCycleIntervalId = null;
  }
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
 * @param {HTMLElement} container The alert-banner element
 * @returns {Function} a function to remove the message element from the banner
 */
function removeBannerMessage(container) {
  return message => {
    container.removeChild(message);

    // If all messages are gone, remove the alert banner itself.
    if (!container.children.length) {
      container.parentElement.removeChild(container);
    }
  };
}

/**
 * Closes the alert banner when the user clicks its close button.
 * It also saves a cookie to remember not to show this again for a while
 * @param {HTMLElement} container The alert banner element
 * @param {HTMLElement} message The message element to close
 * @returns {Function}
 */
function closeAlert(container, message) {
  return () => {
    const cookieId = message.id.replace(/^alertBanner_/, 'atbr_');

    document.cookie = `${cookieId}=1; expires=${messageClosedPeriod()}; path=/`;

    removeBannerMessage(container)(message);
    clearExistingIntervals();
    container.classList.remove('alert-banner--show-secondary');
  };
}

/**
 * Saves an element's original `innerHTML` to `data.origText` on the element, if it was not already saved
 * otherwise, it reverts the elements `innerHTML` to the value saved in `data.origText`
 * @param {HTMLElement} textEl
 * @returns {string}
 */
function resetText(textEl) {
  let origText;

  if (!textEl.data || !textEl.data.origText) {
    origText = textEl.innerHTML;
    textEl.data = {...textEl.data || {}, origText};
  } else {
    origText = textEl.data.origText;
  }
  textEl.innerHTML = origText;
  return origText;
}

/**
 * Enforces adding Ellipsis to a multiline text element that has overflowed
 *
 * NOTE: Use until line-clamp is adopted and works effectively in supported browsers.
 * @param {HTMLElement} textEl
 */
function addEllipsisOnOverflow(textEl) {
  resetText(textEl);

  const style = window.getComputedStyle(textEl),
    isMultiline = textEl.clientHeight >= 2 * parseFloat(style.getPropertyValue('line-height')),
    words = textEl.data.origText.split(' ');
  let isOverflow = isMultiline && (textEl.clientHeight < textEl.scrollHeight);

  while (isOverflow && words.length > 0) {
    words.pop();
    textEl.innerHTML = words.join(' ') + ' …';
    isOverflow = textEl.clientHeight < textEl.scrollHeight;
  }
}

/**
 * Iterates over the child messages and adds a check to create ellipsis on overflow
 *
 * Why? Basically because CSS ellipses currently only work for single line boxes, however,
 * there is a requirement that we show multiple lines on smaller devices, but show ellipses
 * for content that goes over the maximum number of lines - CSD July, 2019
 * @param {HTMLElement} container The alert-banner element
 */
function handleOverflow(container) {
  for (const textEl of container.querySelectorAll('.alert-banner__text')) {
    addEllipsisOnOverflow(textEl);
    window.addEventListener('resize', ()=> addEllipsisOnOverflow(textEl));
  }
}

/**
 * Sets the interval to fade any secondary banner messages into and out of view
 * @param {HTMLElement} container The alert-banner element
 */
function setMessageFadeCycle(container) {
  if (container.children.length > 1) {
    clearExistingIntervals();
    _fadeCycleIntervalId = setInterval(
      () => container.classList.toggle('alert-banner--show-secondary'),
      MESSAGE_CYCLE_DURATION
    );
  }
}

/**
 * Attaches all close handlers to the X button of each banner message
 * @param {HTMLElement} container The alert-banner element
 */
function attachCloseHandlers(container) {
  container
    .querySelectorAll('.alert-banner__message')
    .forEach(message => {
      message
        .querySelector('.alert-banner__close-button')
        .addEventListener('click', closeAlert(container, message), { once: true });
    });
}

/**
 * Checks to see if any alerts on the page should be closed and closes them
 *
 * Why? Because it would appear that some sort of caching is happening and even though the server
 * is not sending any messages, they are still appearing in the page. - CSD
 *
 * @param {HTMLElement} container The alert-banner element
 */
function ensureClosedAlerts(container) {
  const {cookie} = document,
    idRe = /atbr_(\w+)=1/g;

  let match;

  while ((match = idRe.exec(cookie)) !== null) {
    const message = container.querySelector(`#alertBanner_${match[1]}`),
      close = closeAlert(container, message);

    if (message) {
      close();
    }
  }
}

/**
 * Prepares the environment, configures events and binds all handlers needed for banner alerts
 * @param {HTMLElement | {bannerAlertSet:(boolean|undefined)}} el The alert-banner element
 */
function setupAlertBannerClientFunctionality(el) {

  if (el.bannerAlertSet) {
    return;
  }

  el.bannerAlertSet = true; // to prevent potential double entries

  const container = el.querySelector('.alert-banner');

  if (container) {
    handleOverflow(container);
    setMessageFadeCycle(container);
    attachCloseHandlers(container);
    ensureClosedAlerts(container);
  }
}

module.exports = setupAlertBannerClientFunctionality;
