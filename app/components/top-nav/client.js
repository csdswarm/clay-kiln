'use strict';

let isNotDesktop = false,
  activeHamburger = false;

const navSections = document.getElementsByClassName('radiocom-nav__category-button'),
  mobileNavSections = document.getElementsByClassName('nav-drawer__sub-nav'),
  isDesktop = require('../../services/client/isDesktop'),
  navIncludes = require('./nav-includes'),

  /**
   * Toggle hamburger animation & mobile nav on click of hamburger
   * @function toggleHamburger
   * @param {boolean} toggleHamburgerOnly - Toggles hamburger without toggling mobile nav.
   */
  toggleHamburger = toggleHamburgerOnly => {// eslint-disable-line one-var
    const bars = document.getElementsByClassName('bar'),
      navDrawer = document.getElementsByClassName('nav-drawer--mobile')[0],
      activeHamburgerClass = 'active',
      activeMobileNavClass = 'nav-drawer--active';

    isNotDesktop = !isDesktop();
    activeHamburger = isNotDesktop && !activeHamburger;

    if (activeHamburger && isNotDesktop) {
      // Open mobile nav drawer & change hamburger styling
      for (const bar of bars) bar.classList.add(activeHamburgerClass);
      navDrawer.classList.add(activeMobileNavClass);
    } else {
      // Close mobile nav drawer & change hamburger styling
      for (const bar of bars) bar.classList.remove(activeHamburgerClass);
      navDrawer.classList.remove(activeMobileNavClass);
    }
    // Toggle Mobile Nav Drawer
    if (!toggleHamburgerOnly) toggleNavDrawer(navDrawer, activeHamburger);
  },

  /**
   * Toggle desktop or mobile nav drawer/dropdown.
   * @function toggleNavDrawer
   * @param {Object} event - Event from event listener.
   * @param {boolean} show - Open or close drawer/dropdown.
   */
  toggleNavDrawer = (event, show) => {
    const navDrawers = document.getElementsByClassName('nav-drawer');
    let navDrawer;

    isNotDesktop = !isDesktop();
    for (const drawer of navDrawers) {
      drawer.classList.remove('nav-drawer--sub-nav-active');
      drawer.classList.remove('nav-drawer--active');
    }
    if (isNotDesktop) {
      // Toggle mobile nav drawer
      navDrawer = document.getElementsByClassName('nav-drawer--mobile')[0];
      if (show) {
        navDrawer.classList.add('nav-drawer--sub-nav-active');
        navDrawer.classList.add('nav-drawer--active');
      } else {
        navDrawer.classList.remove('nav-drawer--sub-nav-active');
        navDrawer.classList.remove('nav-drawer--active');
      }
    } else {
      // Toggle desktop nav drawer
      navDrawer = event.currentTarget.querySelector('.nav-drawer');
      if (show) {
        navDrawer.classList.add('nav-drawer--sub-nav-active');
        navDrawer.classList.add('nav-drawer--active');
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
      .getElementById('hamburger')
      .addEventListener('click', toggleHamburger);
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
          toggleNavDrawer(e, true);
        });
        navSection.addEventListener('mouseout', e => {
          toggleNavDrawer(e, false);
        });
      }
    }
  },

  /**
   * Remove Mobile Nav When Not on Mobile on Resize of Window
   */
  setMobileNavOnResize = () => {
    window.addEventListener('resize', () => {
      const navDrawer = document.getElementsByClassName('nav-drawer--mobile')[0];

      if (!isDesktop()) {
        navDrawer.classList.remove('nav-drawer--active');
        navDrawer.classList.remove('nav-drawer--sub-nav-active');
        toggleHamburger(true);
      }
    });
  },
  /**
   * Add event listeners to header elements to toggle drawers & images.
   * @function addEventListeners
   */
  addEventListeners = () => {
    toggleMobileOnClick();
    toggleMobileDropdownOnClick();
    toggleDrawersOnCategoryHover();
    setMobileNavOnResize();
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
