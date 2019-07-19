'use strict';
let stationNav,
desktopNavItems,
navDrawersContainer,
desktopNavDrawers,
mobileNavToggle,
mobileNavDrawer,
mobileNavItems;

const { isMobileNavWidth } = require('../../services/client/mobile'),
  active = 'active',

  /**
   * Toggle mobile nav arrow direction & mobile nav on click of arrow
   * 
   * @param {boolean} toggleArrowOnly - Toggles arrow without toggling mobile nav
   */
  toggleMobileDrawer = toggleArrowOnly => {
    mobileNavToggle.classList.toggle(active);
    
    // Toggle Mobile Nav Drawer
    if (!toggleArrowOnly) {
      mobileNavDrawer.classList.toggle(active);
    }
  },

  /**
   * Toggle desktop or mobile nav drawer/dropdown
   * @param {Object} event - Event from event listener
   */
  toggleNavDrawer = ({ type, currentTarget }) => {
    const isMobile = isMobileNavWidth();

    // toggle container for all drawers
    switch (type) {
      case 'mouseover':
        navDrawersContainer.classList.add(active);
        break;
      case 'mouseout':
        navDrawersContainer.classList.remove(active);
        break;
      case 'click':
        navDrawersContainer.classList.toggle(active);
        break;
      default:
    }

    // reset all desktop drawers
    for (let drawer of desktopNavDrawers) {
      drawer.classList.remove(active);
    }

    if (!isMobile) {
      // get desktop nav item label
      console.log(type, currentTarget, Array.from(currentTarget.classList));
      const CLASS_SUBSTRING = 'primary--label-',
        itemLabelClass = Array.from(currentTarget.classList).filter(itemClass => {
          return itemClass.includes(CLASS_SUBSTRING);
        }),
        label = itemLabelClass[0].replace(CLASS_SUBSTRING, '');

      console.log(label);
      // toggle corresponding desktop drawer
      navDrawersContainer.querySelector(`.drawer--desktop.drawer--${ label }`).classList.toggle(active);
    } else {
      toggleMobileDrawer();
    }
  },

  /**
   * Toggle secondary nav items dropdown for primary nav items
   * on mobile on click of primary nav item
   * 
   * @param {Object} event - Event from event listener.
   */
  toggleMobileSecondaryLinks = event => {
    if (!event.currentTarget.classList.contains(active)) {
      // Close dropdown of all categories
      for (let item of mobileNavItems) {
        item.classList.remove(active);
      }
    }
    event.currentTarget.classList.add(active);
  },

  /**
   * Add event listeners to header elements to toggle drawers & images.
   * 
   */
  addEventListeners = () => {
    // Toggle Mobile Nav
    mobileNavToggle.addEventListener('click', toggleMobileDrawer);
    
    // Toggle Dropdowns on Mobile Nav Categories
    mobileNavItems.forEach(item => {
      item.addEventListener('click', toggleMobileSecondaryLinks);
    });
    
    // Toggle Nav Desktop Drawers
    console.log("09");
    desktopNavItems.forEach(item => {
      if (item.classList.contains('primary--drawer-enabled')) {
        item.addEventListener('mouseover', e => { toggleNavDrawer(e); });
        item.addEventListener('mouseout', e => { toggleNavDrawer(e); });
      }
    });
    
    // Remove mobile nav on resize if not on mobile
    window.addEventListener('resize', function () {
      const isMobile = isMobileNavWidth();
      
      if (!isMobile) {
        mobileNavToggle.classList.remove(active);
        mobileNavDrawer.classList.remove(active);
      }
    });
  };

// mount listener for vue (optional)
document.addEventListener('station-nav-mount', function () {
  // code to run when vue mounts/updates, aka after a new "pageview" has loaded.
  stationNav = document.querySelector('.component--station-nav'),
  desktopNavItems = stationNav.querySelectorAll('.navigation__primary'),
  navDrawersContainer = stationNav.querySelector('.station_nav__drawers'),
  desktopNavDrawers = navDrawersContainer.querySelectorAll('.drawer--desktop'),
  mobileNavToggle = stationNav.querySelector('.menu__mobile-toggle'),
  mobileNavDrawer = navDrawersContainer.querySelector('.drawer--mobile'),
  mobileNavItems = mobileNavDrawer.querySelectorAll('.drawer__item');

  addEventListeners();
});
