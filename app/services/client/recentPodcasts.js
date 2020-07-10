'use strict';

const recentPodcasts = 'recentPodcasts',
  maxRecentPodcasts = 49;

/**
 * Get IDs of recent podcasts from localStorage
 * @function
 * @returns {Object[]}
 */
function get() {
  try {
    const fromStorage = localStorage.getItem(recentPodcasts);

    return JSON.parse(fromStorage) || [];
  } catch (e) {
    console.error('Error parsing recentPodcasts from localStorage. Defaulting to empty array');
    return [];
  }

}

/**
 * Add ID of most recent podcast to localStorage
 * @function
 * @param {object} podcastID
 * @returns {Object[]}
 */
function add(podcastID) {
  const excludeCurrentId = recentpodcastID => {
      return recentpodcastID !== podcastID;
    },
    recentPodcastIDs = this.get()
      // if it is the current one, we want to skip it
      // since we'll be moving it back to the front
      // of the list
      .filter(excludeCurrentId)
      .slice(0, maxRecentPodcasts);

  // add to front of list
  recentPodcastIDs.unshift(podcastID);

  localStorage.setItem(
    recentPodcasts,
    JSON.stringify(recentPodcastIDs),
  );

  return recentPodcastIDs;
}

module.exports = {
  get,
  add
};
