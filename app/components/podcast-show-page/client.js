'use strict';

const { fetchDOM } = require('../../services/client/radioApi');
// @TODO: UNDO COMMENT when merging to envs that have ON-444 ON-1381
// podcastEpisodeFactory = require('../podcast-episode-list/client'),
// @TODO: UNDO COMMENTS when merging to envs that have ON-1359 ON-1382
// podcastDiscoverFactory = require('../podcast-discover/client'),
// podcastSetFactory = require('../podcast-set/client');

/**
 * Update tab content
 * @function
 * @param {Node} content
 * @param {String} podcastSiteSlug
 */
async function updateTab(content, podcastSiteSlug) {
  const component = content.querySelector('.component'),
    uri = `//${component.getAttribute('data-uri').replace('@published', '')}.html`;

  uri += '?api-stg=true'; // @TODO remove after site_slug is in prod API

  if (podcastSiteSlug) {
    uri += `podcast-site-slug=${ podcastSiteSlug }`;
  }

  component.parentNode.replaceChild(await fetchDOM(uri), component);
}

class PodcastShowPage {
  constructor(podcastShowPage) {
    const sidebar = document.querySelector('.content__sidebar'),
      tabs = podcastShowPage.querySelectorAll('.tabs-tab'),
      content = podcastShowPage.querySelectorAll('.tabbed-content-container'),
      hash = window.location.hash.replace('#', ''),
      firstTab = tabs[0].className.replace('tabs-tab tabs-tab--', '');

    console.log('firstTab', firstTab);
    this.podcastSiteSlug = podcastShowPage.getAttribute('data-podcast-site-slug');
    this.updates = {
      episodes: this.updateEpisodes.bind(this),
      discover: this.updateDiscover.bind(this)
    };

    sidebar.style.visibility = 'visible';
    this.addTabNavigationListeners(tabs, content);

    if (hash) {
      this.lastUpdated = hash;
      this.activateTab(hash, tabs, content, true);
      window.scrollTo(0, document.querySelector('.podcast-show-page-body').offsetTop);
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

  /**
   * Add navigation listeners to tabs
   * @function
   * @param {NodeListOf} tabs
   * @param {NodeListOf} content
   */
  addTabNavigationListeners(tabs, content) {
    for (const tab of tabs) {
      tab.addEventListener('click', function (e) { this.activateTab(e, tabs, content, true); }.bind(this));
    }
  }

  /**
   * Update podcast episodes tab
   * @function
   * @param {Node} content
   */
  async updateEpisodes(content) {
    await updateTab(content, this.podcastSiteSlug);

    // @TODO: UNDO COMMENT when merging to envs that have ON-444 ON-1381
    // podcastEpisodeFactory(content.querySelector('.component--podcast-episode-list'));
  }

  /**
   * Update discover tab
   * @function
   * @param {Node} content
   */
  async updateDiscover(content) {
    await updateTab(content, this.podcastSiteSlug);

    // @TODO: UNDO COMMENTS when merging to envs that have ON-1359 ON-1382
    // podcastDiscoverFactory(content.querySelector('.component--podcast-discover'));
    // content.querySelectorAll('.component--podcast-set').forEach(podcastSetFactory);
  }

  /**
   * Navigate between tabs
   * @function
   * @param {object} e event or tab name
   * @param {NodeListOf} tabs
   * @param {NodeListOf} content
   * @param {boolean} [useHash]
   */
  async activateTab(e, tabs, content, useHash) {
    console.log('activate tab', e, tabs, content, useHash);
    let contentLabel;

    if (e.currentTarget) {
      contentLabel = e.currentTarget.className.replace('tabs-tab tabs-tab--','');

      console.log('content label', contentLabel);
      for (const tab of tabs) {
        tab.classList.remove('active');
      }
      e.currentTarget.classList.add('active');
    } else {
      contentLabel = e;
      console.log('content label', contentLabel);
      for (const tab of tabs) {
        tab.classList.remove('active');
        if (tab.classList.contains(`tabs-tab--${contentLabel}`)) {
          tab.classList.add('active');
        }
      }
    }

    for (const c of content) {
      c.classList.remove('active');
      if (c.classList.contains(`tabbed-content-container--${contentLabel}`)) {
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
}

module.exports = (element) => new PodcastShowPage(element);
