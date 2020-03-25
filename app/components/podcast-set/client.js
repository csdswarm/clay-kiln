'use strict';

const recentPodcasts = require('../../services/client/recentPodcasts'),
  radioApiService = require('../../services/client/radioApi');

class PodcastSet {
  constructor(element) {
    this.el = element;
    this.set = element.getAttribute('data-set');

    console.log('constructing PodcastSet');
    this.updateDomForSet();
  }

  async getComponentTemplate(podcastIds, set = this.set) {
    let queryParamString = '?';

    if (podcastIds.length) {
      queryParamString += `&podcastIds=${podcastIds.join(',')}`;
    }

    return await radioApiService.fetchDOM(`//${window.location.hostname}/_components/podcast-set/instances/${set}.html${queryParamString}`);
  }

  async updateDomWithIds(podcastIds) {
    const podcastTemplate = await this.getComponentTemplate(podcastIds);

    console.log('template:',podcastTemplate);
  }

  async updateRecent() {
    const podcastIds = recentPodcasts.get(),
      mostRecent = podcastIds.slice(0, 6); // we only want up to 6 most recent podcasts.

    console.log('most recent:', mostRecent);

    if (mostRecent.length) {
      this.updateDomWithIds(mostRecent);
    }

  }

  async updateDomForSet(set = this.set) {
    console.log('update dom:',set);
    switch (set) {
      case 'recent':
        return this.updateRecent();
      default:
        return false;
    }
  }
}


module.exports = el => new PodcastSet(el);
