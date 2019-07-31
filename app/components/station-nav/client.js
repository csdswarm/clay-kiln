'use strict';
let stationNav,
  desktopNavItems,
  navDrawersContainer,
  allDrawers,
  desktopNavDrawers,
  mobileNavToggle,
  mobileNavDrawer,
  mobileNavItems,
  listenNavToggle,
  listenNavDrawer;

const { isMobileNavWidth } = require('../../services/client/mobile'),
  active = 'active',
  active_locked = 'active-locked',

  /**
   * Toggle listen nav arrow direction & listen nav drawer on click of caret
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleListenDrawer = ({ type, currentTarget }) => {
    toggleNavDrawerContainer({ type, currentTarget });

    // reset main nav
    allDrawers.forEach(item => {
      item.classList.remove(active);
    });
    desktopNavItems.forEach(item => {
      item.classList.remove(active);
    });
    mobileNavToggle.classList.remove(active);

    // toggle listen drawer
    listenNavToggle.classList.add(active);
    listenNavDrawer.classList.add(active);
  },
  /**
   * Toggle mobile nav arrow direction & mobile nav on click of caret
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleMobileDrawer = ({ type, currentTarget }) => {
    toggleNavDrawerContainer({ type, currentTarget });

    // reset listen nav
    listenNavToggle.classList.remove(active);
    listenNavDrawer.classList.remove(active);

    // toggle mobile drawer
    mobileNavToggle.classList.toggle(active);
    mobileNavDrawer.classList.toggle(active);
  },
  /**
   * Removes all desktop nav drawers and toggles
   */
  removeNavs = () => {
    navDrawersContainer.classList.remove(active);
    desktopNavItems.forEach(item => {
      item.classList.remove(active);
    });
    listenNavToggle.classList.remove(active);
  },
  /**
   * Toggle nav drawer container that includes
   * all secondaryLinks & mobile nav
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleNavDrawerContainer = ({ type, currentTarget }) => {
    // toggle container for all drawers
    switch (type) {
      case 'mouseover':
        if (currentTarget !== navDrawersContainer) {
          if (currentTarget.classList.contains(active)) {
            console.log("mouseover remove");
            removeNavs();
          } else {
            console.log("mouseover add 1");
            navDrawersContainer.classList.add(active);
          }
        } else {
          console.log("mouseover add 2");
          navDrawersContainer.classList.add(active);
        }
        break;
      case 'mouseout':
        if (currentTarget !== navDrawersContainer) {
          if (currentTarget.classList.contains(active)) {
            console.log("mouseout remove 1");
            removeNavs();
          } else {
            console.log("mouseout add");
            navDrawersContainer.classList.add(active);
          }
        } else {
          console.log("mouseout remove 2");
          removeNavs();
        }
        break;
      case 'click':
        // for mobile navs
        if (currentTarget !== navDrawersContainer) {
          if (currentTarget.classList.contains(active)) {
            navDrawersContainer.classList.remove(active, active_locked);
            desktopNavItems.forEach(item => {
              item.classList.remove(active, active_locked);
            });
            listenNavToggle.classList.remove(active, active_locked);
          } else {
            navDrawersContainer.classList.add(active, active_locked);
          }
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
    // reset all drawers and toggles
    allDrawers.forEach(item => {
      item.classList.remove(active);
    });
    desktopNavItems.forEach(item => {
      item.classList.remove(active);
    });
    listenNavToggle.classList.remove(active);

    toggleNavDrawerContainer({type, currentTarget});

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
    listenNavToggle.addEventListener('mouseover', toggleListenDrawer);
    listenNavToggle.addEventListener('mouseout', toggleListenDrawer);

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
        if (!listenNavDrawer.classList.contains(active)) {
          navDrawersContainer.classList.remove(active, active_locked);
        }
        mobileNavToggle.classList.remove(active);
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
  allDrawers = navDrawersContainer.querySelectorAll('.drawers__drawer');
  desktopNavDrawers = navDrawersContainer.querySelectorAll('.drawer--desktop');
  mobileNavToggle = stationNav.querySelector('.menu__mobile-toggle');
  mobileNavDrawer = navDrawersContainer.querySelector('.drawer--mobile');
  mobileNavItems = mobileNavDrawer.querySelectorAll('.drawer__item');
  listenNavToggle = stationNav.querySelector('.menu__listen-toggle');
  listenNavDrawer = navDrawersContainer.querySelector('.drawer--listen');

  addEventListeners();
});
