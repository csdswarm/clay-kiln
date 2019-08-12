'use strict';

const { fetchDOM } = require('../../services/client/radioApi'),
  stationRecentlyPlayedFactory = require('../station-recently-played/client'),
  stationScheduleFactory = require('../station-schedule/client'),
  stationDiscoverFactory = require('../station-discover/client'),
  stationsListFactory = require('../stations-list/client');

/**
 * Update tab content
 * @function
 * @param {Node} content
 * @param {String} stationId
 */
async function updateTab(content, stationId) {
  const component = content.querySelector('.component');

  let uri = `//${component.getAttribute('data-uri').replace('@published', '')}.html`;

  if (stationId) {
    uri += `?stationId=${stationId}`;
  }

  component.parentNode.replaceChild(await fetchDOM(uri), component);
}

class StationDetail {
  constructor(element) {
    const sidebar = document.querySelector('.content__sidebar'),
      stationDetail = document.querySelector('.component--station-detail'),
      tabs = stationDetail.querySelectorAll('.tabs li'),
      content = stationDetail.querySelectorAll('.tabbed-content__container'),
      hash = window.location.hash.replace('#', ''),
      firstTab = tabs[0].className.replace('tabs__', '');

    this.stationId = element.querySelector('.image__play-btn').getAttribute('data-play-station');
    this.updates = {
      'recently-played': this.updateRecentlyPlayed.bind(this),
      schedule: this.updateSchedule.bind(this),
      discover: this.updateDiscover.bind(this),
      favorites: this.updateFavorites.bind(this)
    };

    this.repositionRightRail(sidebar, stationDetail);
    this.addTabNavigationListeners(tabs, content);

    if (hash) {
      this.lastUpdated = hash;
      this.activateTab(hash, tabs, content, true);
      window.scrollTo(0, document.querySelector('.station-detail__body').offsetTop);
    } else {
      this.lastUpdated = firstTab;
      this.activateTab(firstTab, tabs, content);
    }

    window.onpopstate = () => {
      if (window.location.hash) {
        this.activateTab(window.location.hash.replace('#', ''), tabs, content);
      } else {
        this.activateTab(firstTab, tabs, content);
      }
    };
  }
}

StationDetail.prototype = {
  /**
   * Add margin top to right rail
   * @function
   * @param {object} sidebar
   * @param {Element} stationDetail
   */
  repositionRightRail: function (sidebar, stationDetail) {
    sidebar.style.marginTop = window.getComputedStyle(stationDetail).marginTop;
    sidebar.style.visibility = 'visible';
  },
  /**
   * Add navigation listeners to tabs
   * @function
   * @param {NodeListOf} tabs
   * @param {NodeListOf} content
   */
  addTabNavigationListeners: function (tabs, content) {
    for (let tab of tabs) {
      tab.addEventListener('click', function (e) { this.activateTab(e, tabs, content, true); }.bind(this));
    }
  },

  /**
   * Update recently played tab
   * @function
   * @param {Node} content
   */
  updateRecentlyPlayed: async function (content) {
    await updateTab(content, this.stationId);
    
    stationRecentlyPlayedFactory(content.querySelector('.component--station-recently-played'));
  },

  /**
   * Update station schedule tab
   * @function
   * @param {Node} content
   */
  updateSchedule: async function (content) {
    await updateTab(content, this.stationId);

    stationScheduleFactory(content.querySelector('.component--station-schedule'));
  },

  /**
   * Update discover tab
   * @function
   * @param {Node} content
   */
  updateDiscover: async function (content) {
    await updateTab(content, this.stationId);

    stationDiscoverFactory(content.querySelector('.component--station-discover'));
    content.querySelectorAll('.component--stations-list').forEach(stationsListFactory);
  },

  /**
   * Update favorites tab
   * @function
   * @param {Node} content
   */
  updateFavorites: async function (content) {
    await updateTab(content);

    stationsListFactory(content.querySelector('.component--stations-list'));
  },

  /**
   * Navigate between tabs
   * @function
   * @param {object} e event or tab name
   * @param {NodeListOf} tabs
   * @param {NodeListOf} content
   * @param {boolean} [useHash]
   */
  activateTab: async function (e, tabs, content, useHash) {
    let contentLabel;

    if (e.currentTarget) {
      contentLabel = e.currentTarget.classList[0].replace('tabs__','');

      for (let tab of tabs) {
        tab.classList.remove('active');
      }
      e.currentTarget.classList.add('active');
    } else {
      contentLabel = e;

      for (let tab of tabs) {
        tab.classList.remove('active');
        if (tab.classList.contains(`tabs__${contentLabel}`)) {
          tab.classList.add('active');
        }
      }
    }

    for (let c of content) {
      c.classList.remove('active');
      if (c.classList.contains(`container--${contentLabel}`)) {
        if (this.lastUpdated !== contentLabel) {
          await this.updates[contentLabel](c);
        }

        this.lastUpdated = contentLabel;
        c.classList.add('active');
      }
    }

    if (useHash) {
      history.pushState(null, null, `${window.location.origin}${window.location.pathname}#${contentLabel}`); // set hash without reloading page
    }
  }
};

module.exports = (element) => new StationDetail(element);
