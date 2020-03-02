'use strict';

const navSections = document.getElementsByClassName('radiocom-nav__category-button'),
  mobileNavSections = document.getElementsByClassName('nav-drawer__sub-nav'),
  isDesktop = require('../../services/client/isDesktop'),
  navIncludes = require('./nav-includes'),
  _debounce = require('lodash/debounce'),

  /**
   * Determines whether or not the hamburger menu is in the 'active' state.
   * @function isHamburgerActive
   * @returns {boolean}
   */
  isHamburgerActive = () =>{
    const bars = Array.from(document.querySelectorAll('.bar')),
      activeHamburgerClass = 'active';

    return bars.some((bar) => bar.classList.contains(activeHamburgerClass));// if any of the bars are active, then return true. Otherwise, return false.
  },

  /**
   * Toggles open or closed the mobile navigation menu, depending on its current state.
   * @function toggleMobileNavigation
   */
  toggleMobileNavigation = () => {
    if (isHamburgerActive()) {
      closeMobileNavigation();
    } else {
      openMobileNavigation();
    }
  },

  /**
   * Sets the mobile navigation to its open/active state.
   * @function openMobileNavigation
   * @returns {boolean} Whether the state was successfully set.
   */
  openMobileNavigation = () =>{
    if (isDesktop()) {
      return false;// do not open hamburger menu on desktop
    }
    const bars = document.querySelectorAll('.bar'),
      navDrawer = document.querySelector('.nav-drawer--mobile'),
      activeHamburgerClass = 'active',
      activeMobileNavClass = 'nav-drawer--active';

    // Open mobile nav drawer & change hamburger styling
    for (const bar of bars) {
      bar.classList.add(activeHamburgerClass);
    }
    navDrawer.classList.add(activeMobileNavClass);

    return true;
  },

  /**
   * Sets the mobile navigation to its closed state.
   * @function closeMobileNavigation
   * @returns {boolean} Whether the state was successfully set.
   */
  closeMobileNavigation = () =>{
    const bars = document.querySelectorAll('.bar'),
      navDrawer = document.querySelector('.nav-drawer--mobile'),
      activeHamburgerClass = 'active',
      activeMobileNavClass = 'nav-drawer--active';

    // Close mobile nav drawer & change hamburger styling
    for (const bar of bars) {
      bar.classList.remove(activeHamburgerClass);
    }
    navDrawer.classList.remove(activeMobileNavClass);

    return true;
  },

  /**
   * Opens the desktop navigation menu appropriate to the received event.
   * @param {Object} event Event from event listener. Used to determine which navigation dropdown to show.
   * @returns {boolean} Whether the navigation was successfully shown.
   */
  openNavDrawer = (event) => {
    if (!isDesktop()) {
      return false;// do not open nav drawer on mobile
    }
    // Toggle desktop nav drawer
    const navDrawer = event.currentTarget.querySelector('.nav-drawer');

    navDrawer.classList.add('nav-drawer--sub-nav-active');// TODO: should this be -active, or --active?
    navDrawer.classList.add('nav-drawer--active');
    return true;
  },

  /**
   * Closes all open navigation drawers.
   * @function closeNavDrawers
   */
  closeNavDrawers = () => {
    const navDrawers = document.querySelectorAll('.nav-drawer');

    for (const drawer of navDrawers) {
      drawer.classList.remove('nav-drawer--sub-nav-active');
      drawer.classList.remove('nav-drawer--active');
    }
  },

  /**
   * Toggle dropdown for nav categories on mobile on click of nav category.
   * @function toggleMobileCategoryDropdown
   * @param {Object} event - Event from event listener.
   */
  toggleMobileCategoryDropdown = event => {
    const activeMobileClass = 'nav-drawer__sub-nav--active';

    if (event.currentTarget.classList.contains(activeMobileClass)) {
      // Close dropdown of clicked category if dropdown already open
      event.currentTarget.classList.remove(activeMobileClass);
    } else {
      // Close dropdown of all categories
      for (const navSection of mobileNavSections) {
        navSection.classList.remove(activeMobileClass);
      }
      // Open dropdown of clicked category
      event.currentTarget.classList.add(activeMobileClass);
    }
  },

  /**
   * Toggle Mobile Nav
   */
  toggleMobileOnClick = () => {
    document
      .querySelector('#hamburger')
      .addEventListener('click', toggleMobileNavigation);
  },

  /**
   * Toggle Dropdowns on Mobile Nav Categories
   */
  toggleMobileDropdownOnClick = () => {
    for (const navSection of mobileNavSections) {
      navSection.addEventListener('click', e => {
        toggleMobileCategoryDropdown(e);
      });
    }
  },

  /**
   * Toggle Nav Categories' Drawers
   */
  toggleDrawersOnCategoryHover = () => {
    for (const navSection of navSections) {
      if (navSection.classList.contains('radiocom-nav__category-button--drawer-enabled')) {
        navSection.addEventListener('mouseover', e => {
          openNavDrawer(e);
        });
        navSection.addEventListener('mouseout', () => {
          closeNavDrawers();
        });
      }
    }
  },

  /**
   * Make sure that both mobile and desktop nav bars are closed after resizing the window.
   * This will prevent an open mobile nav bar from persisting when resizing to desktop, and vice versa.
   */
  closeNavOnResize = () => {
    let width = window.innerWidth;
    const debounced = _debounce(() => {
      if (window.innerWidth !== width) {// ensure the width changes, so the event does not trigger when scrolling on mobile
        width = window.innerWidth;
        closeMobileNavigation();
        closeNavDrawers();
      }
    }, 100, { leading:true, trailing:false });// run the function only on the initial 'resize' event, instead of the last.

    window.addEventListener('resize', debounced);
  },
  /**
   * Add event listeners to header elements to toggle drawers & images.
   * @function addEventListeners
   */
  addEventListeners = () => {
    toggleMobileOnClick();
    toggleMobileDropdownOnClick();
    toggleDrawersOnCategoryHover();
    closeNavOnResize();
  };

// mount listener for vue (optional)
document.addEventListener('top-nav-mount', function () {
  // code to run when vue mounts/updates, aka after a new "pageview" has loaded.
  addEventListeners();
  navIncludes.stagingHelper.onMount();
});


// dismount listener for vue
document.addEventListener('top-nav-dismount', function () {
  // code to run when vue mounts/updates, aka after a new "pageview" has unloaded.
  navIncludes.stagingHelper.onDismount();
});
