'use strict';

const recentPodcasts = require('../../services/client/recentPodcasts'),
  radioApiService = require('../../services/client/radioApi'),
  numberOfRecentPodcasts = 6;

class PodcastSet {
  constructor(element) {
    this.el = element;
    this.parentElement = element.parentElement;
    this.set = element.getAttribute('data-set');

    this.updateDomForSet();
  }

  async getComponentTemplate(podcastIds, set = this.set) {
    let queryParamString = '?';

    if (podcastIds.length) {
      queryParamString += `&podcastIds=${podcastIds.join(',')}`;
    }

    const result = await radioApiService.fetchDOM(`//${window.location.hostname}/_components/podcast-set/instances/${set}.html${queryParamString}`)
      .catch((rejected) => {
        console.error('Failure to retrieve podcast DOM:', rejected);
        return false;
      });

    if (result && result.classList.contains('component--podcast-set')) {
      return result; // only return result if we retrieve a valid podcast-set component
    }
    return false;
  }

  async updateDomWithIds(podcastIds) {
    const podcastTemplate = await this.getComponentTemplate(podcastIds),
      parent = this.parentElement;

    if (podcastTemplate) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
      parent.append(podcastTemplate);
      this.el = podcastTemplate;
    }
    return !!podcastTemplate;
  }

  async updateRecent() {
    const podcastIds = recentPodcasts.get(),
      mostRecent = podcastIds.slice(0, numberOfRecentPodcasts);

    if (mostRecent.length) {
      this.el.querySelector('.podcast-set-waiting').classList.remove('hidden');
      return await this.updateDomWithIds(mostRecent);
    } else {
      this.el.querySelector('.podcast-set-empty').classList.remove('hidden');
      return false;
    }

  }

  async updateDomForSet(set = this.set) {
    switch (set) {
      case 'recent':
        return this.updateRecent();
      default:
        return false;
    }
  }
}


module.exports = el => new PodcastSet(el);
