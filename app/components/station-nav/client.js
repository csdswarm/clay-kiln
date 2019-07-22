'use strict';
let stationNav,
desktopNavItems,
navDrawersContainer,
desktopNavDrawers,
mobileNavToggle,
mobileNavDrawer,
mobileNavItems,
listenNavToggle;

const { isMobileNavWidth } = require('../../services/client/mobile'),
  active = 'active',

  toggleListenDrawer = (e) => {
    listenNavToggle.classList.toggle(active);
    // TODO -- Toggle listen drawer here
  },
  /**
   * Toggle mobile nav arrow direction & mobile nav on click of arrow
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleMobileDrawer = ({type, currentTarget}) => {
    mobileNavToggle.classList.toggle(active);

    toggleNavDrawerContainer(type, currentTarget);
    mobileNavDrawer.classList.toggle(active);
  },

  toggleNavDrawerContainer = (type, currentTarget) => {
    const isMobile = isMobileNavWidth();

    // toggle container for all drawers
    switch (type) {
      case 'mouseover':
        if (!isMobile) {
          navDrawersContainer.classList.add(active);
        }
        break;
      case 'mouseout':
        if (!isMobile) {
          navDrawersContainer.classList.remove(active);
        }
        break;
      case 'click':
        if (currentTarget !== navDrawersContainer) {
          navDrawersContainer.classList.toggle(active);
        }
        break;
      default:
    }
  },
  /**
   * Toggle desktop or mobile nav drawer/dropdown
   * @param {Object} event - Event from event listener
   */
  toggleNavDrawer = ({ type, currentTarget }) => {
    const isMobile = isMobileNavWidth();

    toggleNavDrawerContainer(type, currentTarget);

    // reset all desktop drawers
    for (let drawer of desktopNavDrawers) {
      drawer.classList.remove(active);
    }

    if (!isMobile) {
      // get desktop nav item label
      const CLASS_SUBSTRING = 'primary--label-',
        itemLabelClass = Array.from(currentTarget.classList).filter(itemClass => {
          return itemClass.includes(CLASS_SUBSTRING);
        }),
        label = itemLabelClass[0].replace(CLASS_SUBSTRING, '');

      // toggle corresponding desktop drawer if it exists
      const selectedDrawer = navDrawersContainer.querySelector(`.drawer--desktop.drawer--${ label }`);

      if (selectedDrawer) {
        currentTarget.classList.toggle(active);
        selectedDrawer.classList.toggle(active);
      } else {
        currentTarget.classList.remove(active);
        navDrawersContainer.classList.remove(active);
      }
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
    event.currentTarget.classList.toggle(active);
  },

  /**
   * Add event listeners to header elements to toggle drawers & images.
   *
   */
  addEventListeners = () => {
    // Toggle Listen Nav
    listenNavToggle.addEventListener('click', e => { toggleListenDrawer(e); });

    // Toggle Mobile Nav
    mobileNavToggle.addEventListener('click', e => { toggleMobileDrawer(e); });

    // Toggle Dropdowns on Mobile Nav Categories
    mobileNavItems.forEach(item => {
      item.addEventListener('click', toggleMobileSecondaryLinks);
    });

    // Toggle Nav Desktop Drawers
    desktopNavItems.forEach(item => {
      if (item.classList.contains('primary--drawer-enabled')) {
        item.addEventListener('mouseover', e => { toggleNavDrawer(e); });
        item.addEventListener('mouseout', e => { toggleNavDrawer(e); });
      }
    });

    navDrawersContainer.addEventListener('mouseover', e => {
      toggleNavDrawerContainer(e.type, e.currentTarget);
    });
    navDrawersContainer.addEventListener('mouseout', e => {
      toggleNavDrawerContainer(e.type, e.currentTarget);
    });

    // Remove mobile & desktop navs on resize
    window.addEventListener('resize', function () {
      const isMobile = isMobileNavWidth();

      if (!isMobile) {
        mobileNavToggle.classList.remove(active);
        navDrawersContainer.classList.remove(active);
        mobileNavDrawer.classList.remove(active);
      } else {
        // reset all desktop drawers
        for (let drawer of desktopNavDrawers) {
          drawer.classList.remove(active);
        }
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
  mobileNavItems = mobileNavDrawer.querySelectorAll('.drawer__item'),
  listenNavToggle = stationNav.querySelector('.menu__listen-toggle');

  addEventListeners();
});
