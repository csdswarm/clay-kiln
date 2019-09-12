'use strict';

const { hasClass, hasTextContent } = require('../../../client/dom-helpers'),
  KilnInput = window.kiln.kilnInput,
  subscriptions = new KilnInput({}),
  /**
   * Returns the new page button element if it exists
   * @param {Element} navMenu
   * @returns {Element|undefined}
   */
  getNewPageButton = (navMenu) => {
    if (!navMenu) {
      return;
    }

    const textSpan = Array.from(navMenu.querySelectorAll('button > .nav-menu-button-text'))
      .find(hasTextContent('New Page'));

    return textSpan && textSpan.parentElement;
  },
  /**
   * returns the new page button element if it was added
   *
   * @param {object} mutation
   * @returns {Element|undefined}
   */
  getAddedNewPageButton = (mutation) => {
    const navMenu = Array.from(mutation.addedNodes).find(hasClass('nav-menu'));

    return getNewPageButton(navMenu);
  };


subscriptions.subscribe('SHOW_NAV_BACKGROUND', () => {
  let newPageBtn = getNewPageButton(document.querySelector('.kiln-wrapper > .nav-menu'));

  // this shouldn't be declared above the short circuit
  // eslint-disable-next-line one-var
  const kilnWrapper = document.querySelector('.kiln-wrapper'),
    observer = new MutationObserver(mutationList => {
      for (const mutation of mutationList) {
        newPageBtn = getAddedNewPageButton(mutation);

        if (newPageBtn) {
          newPageBtn.style.display = 'none';
        }

        if (Array.from(mutation.removedNodes).find(hasClass('nav-menu'))) {
          observer.disconnect();
        }
      }
    });

  observer.observe(kilnWrapper, { childList: true });
}, false);
