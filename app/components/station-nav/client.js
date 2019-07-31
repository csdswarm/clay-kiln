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
  listenNavDrawer,
  lastTarget;

const { isMobileNavWidth } = require('../../services/client/mobile'),
  active = 'active',
  _find = require('lodash/find'),

  /**
   * Toggle nav drawer container that includes
   * all secondaryLinks, mobile nav & listen nav
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleNavDrawerContainer = ({ type, currentTarget }) => {
    console.log("last target", lastTarget, lastTarget !== mobileNavToggle);
    try {
      switch (type) {
        case 'mouseenter':
          if (lastTarget !== mobileNavToggle) {
            console.log("mouseenter add 2");
            currentTarget.classList.add(active);
            lastTarget.classList.add(active);

            if (lastTarget.classList.contains('navigation__primary')) {
              // get desktop nav item label
              const CLASS_SUBSTRING = 'primary--label-',
              classWithLabel = _find(lastTarget.classList, toggleClass => {
                  return toggleClass.includes(CLASS_SUBSTRING);
                }),
                label = classWithLabel.replace(CLASS_SUBSTRING, ''),
                selectedDrawer = currentTarget.querySelector(`.drawer--desktop.drawer--${ label }`);
              
              if (selectedDrawer) {
                selectedDrawer.classList.add(active);
              }
            } else {
              listenNavDrawer.classList.add(active);
            }
          }
          break;
        case 'mouseleave':
          if (lastTarget !== mobileNavToggle) {
            console.log("mouseleave remove 2");
            currentTarget.classList.remove(active);
            allDrawers.forEach(item => {
              item.classList.remove(active);
            });
            desktopNavItems.forEach(item => {
              item.classList.remove(active);
            });
            listenNavToggle.classList.remove(active);
          }
          break;
        default:
      }
    } catch(e) {
      console.log(e);
    }
  },
  /**
   * Toggle desktop navs on hover of nav items
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

    // get desktop nav item label
    const CLASS_SUBSTRING = 'primary--label-',
      classWithLabel = _find(currentTarget.classList, toggleClass => {
        return toggleClass.includes(CLASS_SUBSTRING);
      }),
      label = classWithLabel.replace(CLASS_SUBSTRING, ''),
      selectedDrawer = navDrawersContainer.querySelector(`.drawer--desktop.drawer--${ label }`);

    if (selectedDrawer) {
      // toggle corresponding desktop drawer if it exists
      if (type === 'mouseleave') {
        console.log("remove desktop drawer & toggle");
        currentTarget.classList.remove(active);
        selectedDrawer.classList.remove(active);
        navDrawersContainer.classList.remove(active);
        lastTarget = currentTarget;
      } else {
        console.log("add desktop drawer & toggle");
        currentTarget.classList.add(active);
        selectedDrawer.classList.add(active);
        navDrawersContainer.classList.add(active);
      }
    }
  },
  /**
   * Toggle listen nav arrow direction & listen nav drawer on hover of caret
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleListenDrawer = ({ type, currentTarget }) => {
    // reset main nav
    allDrawers.forEach(item => {
      item.classList.remove(active);
    });
    desktopNavItems.forEach(item => {
      item.classList.remove(active);
    });
    mobileNavToggle.classList.remove(active);

    // toggle listen drawer
    if (type === 'mouseleave') {
      console.log("remove listen drawer & toggle");
      currentTarget.classList.remove(active);
      listenNavDrawer.classList.remove(active);
      navDrawersContainer.classList.remove(active);
      lastTarget = currentTarget;
    } else {
      console.log("add listen drawer & toggle");
      currentTarget.classList.add(active);
      listenNavDrawer.classList.add(active);
      navDrawersContainer.classList.add(active);
    }
  },
  /**
   * Toggle mobile nav arrow direction & mobile nav on click of caret
   *
   * @param {Object} event -- contains currentTarget
   */
  toggleMobileDrawer = ({ currentTarget }) => {
    // reset main nav
    allDrawers.forEach(item => {
      item.classList.remove(active);
    });
    desktopNavItems.forEach(item => {
      item.classList.remove(active);
    });
    listenNavToggle.classList.remove(active);

    // toggle mobile drawer
    lastTarget = currentTarget;
    currentTarget.classList.toggle(active);
    mobileNavDrawer.classList.toggle(active);
    navDrawersContainer.classList.toggle(active);
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
    listenNavToggle.addEventListener('mouseenter', toggleListenDrawer);
    listenNavToggle.addEventListener('mouseleave', toggleListenDrawer);

    // Toggle Mobile Nav
    mobileNavToggle.addEventListener('click', toggleMobileDrawer);

    // Toggle Dropdowns on Mobile Nav Categories
    mobileNavItems.forEach(item => {
      item.addEventListener('click', toggleMobileSecondaryLinks);
    });

    // Toggle Nav Desktop Drawers
    desktopNavItems.forEach(item => {
      if (item.classList.contains('primary--drawer-enabled')) {
        item.addEventListener('mouseenter', toggleNavDrawer);
        item.addEventListener('mouseleave', toggleNavDrawer);
      }
    });

    navDrawersContainer.addEventListener('mouseenter', toggleNavDrawerContainer);
    navDrawersContainer.addEventListener('mouseleave', toggleNavDrawerContainer);

    // Remove mobile & desktop navs on resize
    window.addEventListener('resize', function () {
      const isMobile = isMobileNavWidth();

      if (!isMobile) {
        if (!listenNavDrawer.classList.contains(active)) {
          navDrawersContainer.classList.remove(active);
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
