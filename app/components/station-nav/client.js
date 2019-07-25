'use strict';
let stationNav,
  desktopNavItems,
  navDrawersContainer,
  desktopNavDrawers,
  mobileNavToggle,
  mobileNavDrawer,
  mobileNavItems,
  listenNavToggle,
  listenNavDrawer;

const { isMobileNavWidth } = require('../../services/client/mobile'),
  active = 'active',

  /**
   * Toggle listen nav arrow direction & listen nav drawer on click of caret
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleListenDrawer = ({type, currentTarget}) => {
    listenNavToggle.classList.toggle(active);

    toggleNavDrawerContainer({type, currentTarget});
    listenNavDrawer.classList.toggle(active);
  },
  /**
   * Toggle mobile nav arrow direction & mobile nav on click of caret
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleMobileDrawer = ({ type, currentTarget }) => {
    mobileNavToggle.classList.toggle(active);

    toggleNavDrawerContainer({type, currentTarget});
    mobileNavDrawer.classList.toggle(active);
  },
  /**
   * Toggle nav drawer container that includes
   * all secondaryLinks & mobile nav
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleNavDrawerContainer = ({ type, currentTarget }) => {
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
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleNavDrawer = ({ type, currentTarget }) => {
    const isMobile = isMobileNavWidth();

    toggleNavDrawerContainer({type, currentTarget});

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
        label = itemLabelClass[0].replace(CLASS_SUBSTRING, ''),
        selectedDrawer = navDrawersContainer.querySelector(`.drawer--desktop.drawer--${ label }`);

      if (selectedDrawer) {
        // toggle corresponding desktop drawer if it exists
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
   * @param {Object} event -- contains currentTarget
   */
  toggleMobileSecondaryLinks = ({ currentTarget }) => {
    if (!currentTarget.classList.contains(active)) {
      // Close dropdown of all categories
      for (let item of mobileNavItems) {
        item.classList.remove(active);
      }
    }
    currentTarget.classList.toggle(active);
  },

  /**
   * Add event listeners to nav elements to toggle drawers & carets.
   *
   */
  addEventListeners = () => {
    // Toggle Listen Nav
    listenNavToggle.addEventListener('click', toggleListenDrawer);

    // Toggle Mobile Nav
    mobileNavToggle.addEventListener('click', toggleMobileDrawer);

    // Toggle Dropdowns on Mobile Nav Categories
    mobileNavItems.forEach(item => {
      item.addEventListener('click', toggleMobileSecondaryLinks);
    });

    // Toggle Nav Desktop Drawers
    desktopNavItems.forEach(item => {
      if (item.classList.contains('primary--drawer-enabled')) {
        item.addEventListener('mouseover', toggleNavDrawer);
        item.addEventListener('mouseout', toggleNavDrawer);
      }
    });

    navDrawersContainer.addEventListener('mouseover', toggleNavDrawerContainer);
    navDrawersContainer.addEventListener('mouseout', toggleNavDrawerContainer);

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
  stationNav = document.querySelector('.component--station-nav');
  desktopNavItems = stationNav.querySelectorAll('.navigation__primary');
  navDrawersContainer = stationNav.querySelector('.station_nav__drawers');
  desktopNavDrawers = navDrawersContainer.querySelectorAll('.drawer--desktop');
  mobileNavToggle = stationNav.querySelector('.menu__mobile-toggle');
  mobileNavDrawer = navDrawersContainer.querySelector('.drawer--mobile');
  mobileNavItems = mobileNavDrawer.querySelectorAll('.drawer__item');
  listenNavToggle = stationNav.querySelector('.menu__listen-toggle');
  listenNavDrawer = navDrawersContainer.querySelector('.drawer--listen');

  addEventListeners();
});
