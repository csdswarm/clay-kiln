'use strict';

const navSections = document.getElementsByClassName('radiocom-nav__category-button'),
  mobileNavSections = document.getElementsByClassName('nav-drawer__sub-nav'),
  mutableImages = ['account-btn', 'search-btn'];
let isMobile = false,
  activeHamburger = false;

/**
 * Toggle hamburger animation & mobile nav on click of hamburger
 * @function toggleHamburger
 * @param {boolean} toggleHamburgerOnly - Toggles hamburger without toggling mobile nav.
 */
const toggleHamburger = toggleHamburgerOnly => {// eslint-disable-line one-var
    let bars = document.getElementsByClassName('bar'),
      navDrawer = document.getElementsByClassName('nav-drawer--mobile')[0],
      activeHamburgerClass = 'active',
      activeMobileNavClass = 'nav-drawer--active';

    isMobile =
    !(document.getElementsByClassName('radiocom-nav-placeholder')[0].offsetWidth >
    1023);
    activeHamburger = !activeHamburger;
    if (activeHamburger && isMobile) {
    // Open mobile nav drawer & change hamburger styling
      for (let bar of bars) bar.classList.add(activeHamburgerClass);
      navDrawer.classList.add(activeMobileNavClass);
    } else {
    // Close mobile nav drawer & change hamburger styling
      for (let bar of bars) bar.classList.remove(activeHamburgerClass);
      navDrawer.classList.remove(activeMobileNavClass);
    }
    // Toggle Mobile Nav Drawer
    if (!toggleHamburgerOnly) toggleNavDrawer(navDrawer, activeHamburger, true);
  },

  /**
 * Toggle desktop or mobile nav drawer/dropdown.
 * @function toggleNavDrawer
 * @param {Object} event - Event from event listener.
 * @param {boolean} show - Open or close drawer/dropdown.
 */
  toggleNavDrawer = (event, show) => {
    let navDrawer,
      classes = ['nav-drawer--sub-nav-active', 'nav-drawer--active'],
      navDrawers = document.getElementsByClassName('nav-drawer');

    isMobile =
    !(document.getElementsByClassName('radiocom-nav-placeholder')[0].offsetWidth >
    1023);
    for (let drawer of navDrawers) drawer.classList.remove(...classes);
    if (!isMobile) {
    // Toggle desktop nav drawer
      navDrawer = event.currentTarget.querySelector('.nav-drawer');
      if (show) navDrawer.classList.add(...classes);
    } else {
    // Toggle mobile nav drawer
      navDrawer = document.getElementsByClassName('nav-drawer--mobile')[0];
      if (show) {
        navDrawer.classList.add(...classes);
      } else {
        navDrawer.classList.remove(...classes);
      }
    }
  },

  /**
 * Toggle dropdown for nav categories on mobile on click of nav category
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
      for (let navSection of mobileNavSections) {
        navSection.classList.remove(activeMobileClass);
      }
      // Open dropdown of clicked category
      event.currentTarget.classList.add(activeMobileClass);
    }
  },

  /**
 * Toggle image source for those images that change on hover.
 * @function toggleImage
 * @param {Object} event - Event from event listener.
 */
  toggleImage = event => {
    const defaultImage = event.currentTarget.querySelector('.default'),
      hoveredImage = event.currentTarget.querySelector('.hover');

    if (event.type == 'mouseover') {
      defaultImage.classList.add('inactive');
      defaultImage.classList.remove('active');
      hoveredImage.classList.add('active');
      hoveredImage.classList.remove('inactive');
    } else {
      defaultImage.classList.add('active');
      defaultImage.classList.remove('inactive');
      hoveredImage.classList.add('inactive');
      hoveredImage.classList.remove('active');
    }
  },

  /**
 * Add event listeners to header elements to toggle drawers & images.
 * @function addEventListeners
 */
  addEventListeners = () => {
  // Toggle Mobile Nav
    document.getElementById('hamburger').addEventListener('click', toggleHamburger);
    // Toggle Images on Hover
    for (let image of mutableImages) {
      document.getElementById(image).addEventListener('mouseover', function (e) { toggleImage(e); });
      document.getElementById(image).addEventListener('mouseout', function (e) { toggleImage(e); });
    }
    // Toggle Dropdowns on Mobile Nav Categories
    for (let navSection of mobileNavSections) {
      navSection.addEventListener('click', function (e) { toggleMobileCategoryDropdown(e); });
    }
    // Toggle Nav Categories' Drawers
    for (let navSection of navSections) {
      if (navSection.classList.contains('radiocom-nav__category-button--drawer-enabled')) {
        navSection.addEventListener('mouseover', function (e) { toggleNavDrawer(e, true); });
        navSection.addEventListener('mouseout', function (e) { toggleNavDrawer(e, false); });
      }
    }
    // Remove Mobile Nav When Not on Mobile on Resize of Window
    window.addEventListener('resize', function () {
      let navDrawer = document.getElementsByClassName('nav-drawer--mobile')[0],
        classes = ['nav-drawer--active', 'nav-drawer--sub-nav-active'];

      isMobile =
      !(document.getElementsByClassName('radiocom-nav-placeholder')[0].offsetWidth >
      1023);
      if (!isMobile) {
        navDrawer.classList.remove(...classes);
        toggleHamburger(true);
      }
    });
  };

// mount listener for vue (optional)
document.addEventListener('top-nav-mount', function () {
  // code to run when vue mounts/updates, aka after a new "pageview" has loaded.
  addEventListeners();
});
