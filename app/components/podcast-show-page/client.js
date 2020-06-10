'use strict';

const { fetchDOM } = require('../../services/client/radioApi');
// @TODO: UNDO COMMENT when merging to envs that have ON-444 ON-1381 ON-1522
// podcastEpisodeFactory = require('../podcast-episode-list/client'),
// @TODO: UNDO COMMENTS when merging to envs that have ON-1359 ON-1382
// podcastDiscoverFactory = require('../podcast-discover/client'),
// podcastSetFactory = require('../podcast-set/client');
let lastUpdated, updates;

/**
 * Add navigation listeners to tabs
 * @function
 * @param {NodeListOf} tabs
 * @param {NodeListOf} content
 */
function addTabNavigationListeners(tabs, content) {
  for (const tab of tabs) {
    tab.addEventListener('click',
      function (e) {
        activateTab(e, tabs, content, true);
      }
    );
  }
}
/**
 * Update tab content
 * @function
 * @param {Node} content
 * @param {String} podcastSiteSlug
 */
async function updateTab(content, podcastSiteSlug) {
  const component = content.querySelector('.component');

  if (component) { // @TODO remove check after ON-1359 ON-1382 are done (discover tickets)
    let uri = `//${component.getAttribute('data-uri').replace('@published', '')}.html`;

    if (podcastSiteSlug) {
      uri += `?podcast-site-slug=${ podcastSiteSlug }`;
    }

    component.parentNode.replaceChild(await fetchDOM(uri), component);
  }
}
/**
 * Update podcast episodes tab
 * @function
 * @param {Node} content
 * @param {string} podcastSiteSlug
 */
async function updateEpisodes(content, podcastSiteSlug) {
  await updateTab(content, podcastSiteSlug);

  // @TODO: UNDO COMMENT when merging to envs that have ON-444 ON-1381 ON-1522
  // podcastEpisodeFactory(content.querySelector('.component--podcast-episode-list'));
}

/**
 * Update discover tab
 * @function
 * @param {Node} content
 * @param {string} podcastSiteSlug
 */
async function updateDiscover(content, podcastSiteSlug) {
  await updateTab(content, podcastSiteSlug);

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
async function activateTab(e, tabs, content, useHash) {
  let contentLabel;

  if (e.currentTarget) {
    contentLabel = e.currentTarget.className.replace('tabs-tab tabs-tab--','');

    for (const tab of tabs) {
      tab.classList.remove('active');
    }
    e.currentTarget.classList.add('active');
  } else {
    contentLabel = e;
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
      if (lastUpdated !== contentLabel) {
        await updates[contentLabel](c);
      }

      lastUpdated = contentLabel;
      c.classList.add('active');
    }
  }

  if (useHash) {
    history.pushState(null, null, `${window.location.origin}${window.location.pathname}${window.location.search}#${contentLabel}`); // set hash without reloading page
  }
}

class PodcastShowPage {
  constructor() {
    document.addEventListener('podcast-show-page-mount', (e) => {
      const podcastShowPage = e.target.querySelector('.component--podcast-show-page'),
        sidebar = e.target.querySelector('.content__sidebar'),
        tabs = podcastShowPage.querySelectorAll('.tabs-tab'),
        contentContainer = podcastShowPage.querySelector('.tabbed-content'),
        content = podcastShowPage.querySelectorAll('.tabbed-content-container'),
        firstTab = tabs[0].className.replace('tabs-tab tabs-tab--', ''),
        podcastSiteSlug = podcastShowPage.getAttribute('data-podcast-site-slug'),
        hash = window.location.hash.replace('#', '');

      updates = {
        episodes: () => updateEpisodes(contentContainer, podcastSiteSlug),
        discover: () => updateDiscover(contentContainer, podcastSiteSlug)
      };
      sidebar.style.visibility = 'visible';
      addTabNavigationListeners(tabs, content);
      for (const tab of tabs) {
        tab.querySelector('a').addEventListener('click', e => e.preventDefault());
      }

      if (hash) {
        lastUpdated = hash;
        activateTab(lastUpdated, tabs, content, true);
        window.scrollTo(0, document.querySelector('.podcast-show-page-body').offsetTop);
      } else {
        lastUpdated = firstTab;
        activateTab(lastUpdated, tabs, content);
      }

      window.onpopstate = () => {
        if (window.location.hash) {
          lastUpdated = window.location.hash.replace('#', '');
          activateTab(lastUpdated, tabs, content, true);
        } else {
          lastUpdated = firstTab;
          activateTab(lastUpdated, tabs, content);
        }
      };
    });
  }
}

module.exports = (element) => new PodcastShowPage(element);
