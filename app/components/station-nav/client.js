'use strict';

let isMobile = false,
  activeMobileToggle = false;
const { isMobileNavWidth } = require('../../services/client/mobile'),
  active = 'active',
  stationNav = document.querySelector('.component--station-nav'),
  primaryNavItems = stationNav.querySelectorAll('.navigation__primary'),
  desktopNavDrawers = stationNav.querySelectorAll('.primary__drawer'),
  mobileNavToggle = stationNav.querySelector('.menu__mobile-toggle'),
  mobileNavDrawer = stationNav.querySelector('.station_nav__drawer--mobile'),
  mobileNavItems = stationNav.querySelectorAll('.station_nav__drawer--mobile .drawer__item'),
  /**
   * Toggle mobile nav arrow direction & mobile nav on click of arrow
   * @function toggleMobileMenu
   * @param {boolean} toggleArrowOnly - Toggles arrow without toggling mobile nav
   */
  toggleMobileMenu = toggleArrowOnly => {
    isMobile = isMobileNavWidth();
    
    activeMobileToggle = mobileNavToggle.classList.contains(active);
    mobileNavToggle.classList.toggle(active);
    mobileNavDrawer.classList.toggle(active);
    
    // Toggle Mobile Nav Drawer
    if (!toggleArrowOnly) {
      toggleNavDrawer();
    }
  },

  /**
   * Toggle desktop or mobile nav drawer/dropdown
   * @param {Object} [event] - Event from event listener
   */
  toggleNavDrawer = (event) => {
    isMobile = isMobileNavWidth();
    for (let drawer of desktopNavDrawers) {
      drawer.classList.remove(active);
    }
    if (!isMobile) {
      // Toggle desktop nav drawer
      event.currentTarget.querySelector('.primary__drawer').classList.toggle(active);
    } else {
      // Toggle mobile nav drawer
      if (activeMobileToggle) {
        mobileNavDrawer.classList.add(active);
      } else {
        mobileNavDrawer.classList.remove(active);
      }
    }
  },

  /**
   * Toggle secondary nav items dropdown for primary nav items
   * on mobile on click of primary nav item
   * @function toggleMobileSecondaryLinks
   * @param {Object} event - Event from event listener.
   */
  toggleMobileSecondaryLinks = event => {
    if (!event.currentTarget.classList.contains(active)) {
      // Close dropdown of all categories
      for (let item of mobileNavItems) {
        item.classList.remove(active);
      }
    }
    event.currentTarget.classList.toggle(active);
  },

  /**
   * Add event listeners to header elements to toggle drawers & images.
   * @function addEventListeners
   */
  addEventListeners = () => {
    // Toggle Mobile Nav
    mobileNavToggle.addEventListener('click', toggleMobileMenu);
    // Toggle Dropdowns on Mobile Nav Categories
    for (let item of mobileNavItems) {
      item.addEventListener('click', function (e) { toggleMobileSecondaryLinks(e); });
    }
    // Toggle Nav Categories' Drawers
    for (let item of primaryNavItems) {
      if (item.classList.contains('navigation__primary--drawer-enabled')) {
        item.addEventListener('mouseover', toggleNavDrawer);
        item.addEventListener('mouseout', toggleNavDrawer);
      }
    }
    // Remove Mobile Nav When Not on Mobile on Resize of Window
    window.addEventListener('resize', function () {
      isMobile = isMobileNavWidth();
      
      if (!isMobile) {
        mobileNavToggle.classList.remove(active);
        mobileNavDrawer.classList.remove(active);
      }
    });
  };

// mount listener for vue (optional)
document.addEventListener('station-nav-mount', function () {
  // code to run when vue mounts/updates, aka after a new "pageview" has loaded.
  addEventListeners();
});
