'use strict';

let desktopNavItems,
  navDrawersContainer,
  allDrawers,
  desktopNavDrawers,
  mobileNavToggle,
  mobileNavDrawer,
  mobileNavItems,
  listenNavToggle,
  listenNavDrawer,
  listenNavComponent,
  stationId,
  stationListenNavInstance,
  lastTarget,
  isMobile = false,
  thresholdNavBar;


const stationNavBar = document.querySelector('.station-nav__fixed-container');

if (stationNavBar) {
  // Assures that the stationNavBar is present before attaching the event.
  thresholdNavBar = stationNavBar.offsetTop;
  // Needs to be added outside the station-nav-mount event.
  window.onscroll = function () { toggleStickyNavBar(); };
}


const { getComponentInstance } = require('clayutils'),
  { isMobileNavWidth } = require('../../services/client/mobile'),
  { fetchDOM } = require('../../services/client/radioApi'),
  active = 'active',
  /**
   * load in new data for listen nav from the api
   * @returns {Promise}
   */
  refreshListenNav = async () => {
    const doc = await fetchDOM(`/_components/station-listen-nav/instances/${ stationListenNavInstance }@published.html?stationId=${stationId}`, { bypassCache: true }),
      oldChild = listenNavDrawer.querySelector('.component--station-listen-nav');

    listenNavDrawer.replaceChild(doc, oldChild);
  },
  /**
   * Reset main & listen navs & toggles
  */
  resetNavs = () => {
    [
      navDrawersContainer,
      Array.from(allDrawers),
      Array.from(desktopNavItems),
      listenNavToggle,
      mobileNavToggle
    ].flat()
      .forEach( item => {
        item.classList.remove(active);
      });
  },
  /**
   * Toggle nav drawer container that includes
   * all secondaryLinks & listen nav.
   * Does not affect mobile nav.
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleNavDrawerContainer = ({ type, currentTarget }) => {
    switch (type) {
      case 'mouseenter':
        if (lastTarget !== mobileNavToggle) {
          // activate drawer container
          currentTarget.classList.add(active);
          // activate toggle
          lastTarget.classList.add(active);

          // activate drawer for main nav or listen nav
          if (lastTarget.classList.contains('navigation__primary')) {
            // get label to activate the right drawer
            const CLASS_SUBSTRING = 'primary--label-',
              classWithLabel = Array.from(lastTarget.classList).find(toggleClass => {
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
          resetNavs();
        }
        break;
      default:
    }
  },
  /**
   * Toggle desktop navs on hover of nav items
   *
   * @param {Object} event -- contains type and currentTarget
   */
  toggleNavDrawer = ({ type, currentTarget }) => {
    resetNavs();
    // get desktop nav item label
    const CLASS_SUBSTRING = 'primary--label-',
      classWithLabel = Array.from(currentTarget.classList).find(toggleClass => {
        return toggleClass.includes(CLASS_SUBSTRING);
      }),
      label = classWithLabel.replace(CLASS_SUBSTRING, ''),
      selectedDrawer = navDrawersContainer.querySelector(`.drawer--desktop.drawer--${ label }`);

    if (selectedDrawer) {
      // toggle corresponding desktop drawer if it exists
      if (type === 'mouseleave') {
        currentTarget.classList.remove(active);
        selectedDrawer.classList.remove(active);
        navDrawersContainer.classList.remove(active);
        lastTarget = currentTarget;
      } else {
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
    if (!isMobile) {
      resetNavs();
      type === 'mouseleave'
        ? closeListenDrawer(currentTarget)
        : openListenDrawer(currentTarget);
    }
  },
  /**
   * Toggle listen nav arrow direction & listen nav drawer on touch for mobile
   *
   * @param {Object} currentTarget -- currentTarget
   * @return {void}
   */
  toggleListenDrawerInMobile = ({ currentTarget }) => {
    isMobile = true;

    if (!currentTarget.classList.contains(active)) {
      return openListenDrawer(currentTarget);
    }
    closeListenDrawer(currentTarget);
  },
  /**
   * Opens listen nav arrow direction & listen nav drawer
   *
   * @param {Object} target -- currentTarget
   */
  openListenDrawer = (target) => {
    refreshListenNav();

    // remove active status from mobile menu drawer
    mobileNavToggle.classList.remove(active);
    mobileNavDrawer.classList.remove(active);

    // set active status to listen nav drawer
    target.classList.add(active);
    listenNavDrawer.classList.add(active);
    navDrawersContainer.classList.add(active);
  },
  /**
   * Closes listen nav arrow direction & listen nav drawer
   *
   * @param {Object} target -- currentTarget
   */
  closeListenDrawer = (target) => {
    target.classList.remove(active);
    listenNavDrawer.classList.remove(active);
    navDrawersContainer.classList.remove(active);
    lastTarget = target;
  },
  /**
   * Toggle mobile nav arrow direction & mobile nav on click of caret
   *
   * @param {Object} event -- contains currentTarget
   * @return {void}
   */
  toggleMobileDrawer = ({ currentTarget }) => {
    // reset desktop navs & toggles
    desktopNavItems.forEach(item => {
      item.classList.remove(active);
    });

    lastTarget = currentTarget;

    if (!currentTarget.classList.contains(active)) {
      // close all secondary dropdowns before opening nav drawer
      for (const item of mobileNavItems) {
        item.classList.remove(active);
      }
      return openMobileDrawer(currentTarget);
    }
    closeMobileDrawer(currentTarget);
  },
  /**
   * Opens mobile menu nav arrow direction & drawer
   *
   * @param {Object} target -- currentTarget
   */
  openMobileDrawer = (target) => {
    // remove active status from listen nav drawer
    listenNavToggle.classList.remove(active);
    listenNavDrawer.classList.remove(active);

    // set active status to menu nav drawer
    target.classList.add(active);
    mobileNavDrawer.classList.add(active);
    navDrawersContainer.classList.add(active);
  },
  /**
   * Closes mobile menu nav arrow direction & drawer
   *
   * @param {Object} target -- currentTarget
   */
  closeMobileDrawer = (target) => {
    target.classList.remove(active);
    mobileNavDrawer.classList.remove(active);
    navDrawersContainer.classList.remove(active);
  },
  /**
   * Toggle secondary nav items dropdown for primary nav items
   * on mobile on click of primary nav item
   *
   * @param {Object} event -- contains currentTarget
   */
  toggleMobileSecondaryLinks = ( event ) => {
    event.preventDefault();

    const { currentTarget } = event;

    if (!currentTarget.classList.contains(active)) {
      // Close dropdown of all categories
      for (const item of mobileNavItems) {
        item.classList.remove(active);
      }
    }
    currentTarget.classList.toggle(active);
  },

  /**
   * Toggle Sticky Station Nav Bar
   */
  toggleStickyNavBar = () => {
    // Handles sticky nav bars.
    const topNavBar = document.querySelector('.radiocom-nav'),
      stationNavBar = document.querySelector('.station-nav__fixed-container');

    topNavBar.classList.add('reset-radiocom-top-nav');
    if (window.pageYOffset > thresholdNavBar) {
      stationNavBar.classList.add('sticky-station-nav-bar');
    } else {
      stationNavBar.classList.remove('sticky-station-nav-bar');
    }
  },

  /**
   * Add event listeners to nav elements to toggle drawers & carets.
   *
   */
  addEventListeners = () => {
    // Toggle Listen Nav
    listenNavToggle.addEventListener('mouseenter', toggleListenDrawer);
    listenNavToggle.addEventListener('mouseleave', toggleListenDrawer);
    listenNavToggle.addEventListener('touchstart', toggleListenDrawerInMobile, true);

    // Toggle Mobile Nav
    mobileNavToggle.addEventListener('click', toggleMobileDrawer);

    // Toggle Dropdowns on Mobile Nav Categories
    mobileNavItems.forEach(item => {
      if (item.querySelectorAll('.item__label>.label__menu-toggle')) {
        item.addEventListener('click', toggleMobileSecondaryLinks);
      }
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
      const isMobileWidth = isMobileNavWidth();

      if (!isMobileWidth) {
        isMobile = false;
        resetNavs();
      } else {
        // reset all desktop drawers
        for (const drawer of desktopNavDrawers) {
          drawer.classList.remove(active);
        }
      }
    });

  };

// mount listener for vue (optional)
document.addEventListener('station-nav-mount', function () {
  // code to run when vue mounts/updates, aka after a new "pageview" has loaded.
  const stationNav = document.querySelector('.component--station-nav');

  desktopNavItems = stationNav.querySelectorAll('.navigation__primary');
  navDrawersContainer = stationNav.querySelector('.station_nav__drawers');
  allDrawers = navDrawersContainer.querySelectorAll('.drawers__drawer');
  desktopNavDrawers = navDrawersContainer.querySelectorAll('.drawer--desktop');
  mobileNavToggle = stationNav.querySelector('.menu__mobile-toggle');
  mobileNavDrawer = navDrawersContainer.querySelector('.drawer--mobile');
  mobileNavItems = mobileNavDrawer.querySelectorAll('.drawer__item');
  listenNavToggle = stationNav.querySelector('.menu__listen-toggle');
  listenNavDrawer = navDrawersContainer.querySelector('.drawer--listen');
  listenNavComponent = document.querySelector('.component--station-listen-nav');
  stationId = stationNav.dataset.stationId;
  stationListenNavInstance = getComponentInstance(listenNavComponent.dataset.uri);


  addEventListeners();
});
