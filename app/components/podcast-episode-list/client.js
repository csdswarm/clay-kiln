'use strict';

const
  _bindAll = require('lodash/bindAll'),
  rest = require('../../services/universal/rest'),
  doc = document,
  componentName = 'podcast-episode-list',
  sortingValues = ['oldest', 'newest'],
  qs = require('qs'),
  componentClassName = 'podcast-episode-list',
  { utils } = require('../../services/client/utils'),
  clientCommunicationBridge = require('../../services/client/ClientCommunicationBridge')(),
  loadMoreAmount = 20;

let
  $, $$;




/**
 * model class for the client side component
 */
class PodcastListComponentModel {
  /**
   * Create a model
   * @param {HTMLElement} containerElement - The HTMLElement of the component.
   */
  constructor(containerElement) {
    this.isLoading = false;
    this.apiParams = {
      podcastSiteSlug: containerElement.getAttribute('data-podcast-site-slug'),
      stationSiteSlug: containerElement.getAttribute('data-station-site-slug'),
      sortOrder: sortingValues[1],
      pageNumber: 2
    };
    this.apiEndpoint = '//' + containerElement.getAttribute('data-uri').replace('@published', '');
  }
  /**
   * setter for pageNumber
   * @param {Number} value - new value
   */
  set pageNumber(value) {
    this.apiParams.pageNumber = value;
  }
  /**
   * getter for pageNumber
   */
  get pageNumber() {
    return this.apiParams.pageNumber;
  }
  /**
   * get a new api url with serialized query params
   * @param {Boolean} isLoadMoreRequest - is this coming from load more
   * @return {String}
   */
  getApiUrl(isLoadMoreRequest) {
    const serialized = qs.stringify({
      query: {
        page: this.apiParams.pageNumber,
        sort: !isLoadMoreRequest ? this.apiParams.sortOrder : this.getOppositeSortOrder(),
        'podcast-site-slug': this.apiParams.podcastSiteSlug,
        'station-site-slug': this.apiParams.stationSiteSlug
      }
    });

    return `${this.apiEndpoint}?${serialized}`;
  }
  /**
   * get the opposite of the current drop down order for use with loading more
   * @return {String} // sorting order
   */
  getOppositeSortOrder() {
    if (this.apiParams.sortOrder === sortingValues[0]) {
      return sortingValues[1];
    }
    return sortingValues[0];
  }
  /**
   * get a new GET request to the api
   * @param {Boolean} isLoadMoreRequest - is this coming from load more
   * @return {Promise}
   */
  getEpisodes(isLoadMoreRequest = false) {
    return rest.get(
      this.getApiUrl(isLoadMoreRequest)
    );
  }
}




/**
 * view class for the client side component
 */
class PodcastListComponentView {
  /**
   * Create a view.
   * @param {HTMLElement} containerElement - The HTMLElement of the component.
   */
  constructor(containerElement) {
    this.elements = {
      container: containerElement,
      sortDropdown: $('#episodesOrder'),
      episodesContainer: $(`.${componentClassName}__episodes`),
      loadMoreBtn: $(`.${componentClassName}__load-more-btn`)
    };
    this.itemTemplate = this.getHtmlTemplateFromClone();
  }
  /**
   * looks at the clone and identifies all the elements that need to get new data
   * @return {Function} // function that will except episode data
   */
  getHtmlTemplateFromClone() {
    const
      clone = this.elements.episodesContainer.children[0].cloneNode(true),
      cloneElements = {
        image:                      clone.querySelector(`.${componentClassName}__image`),
        link:                       clone.querySelector(`.${componentClassName}__download-link`),
        playBtn:                    clone.querySelector(`.${componentClassName}__play-btn`),
        published_date_formatted:   clone.querySelector(`.${componentClassName}__pub-date`),
        duration_seconds_formatted: clone.querySelector(`.${componentClassName}__duration-text`),
        title:                      clone.querySelector(`.${componentClassName}__title`),
        description:                clone.querySelector(`.${componentClassName}__description`)
      };

    // return function that excepts episode data and returns html with replaced data
    return (data) => {
      for (const key in cloneElements) {
        if (cloneElements.hasOwnProperty(key)) {
          const element = cloneElements[key];

          switch (key) {
            case 'image':
              element.setAttribute('src', data.attributes.image_url);
              break;
            case 'link':
              element.setAttribute('href', data.attributes.audio_url);
              break;
            case 'playBtn':
              element.setAttribute('href', '#');
              // setting for player needs
              element.dataset.playPodcastEpisodeId = data.id,
              element.dataset.playPodcastShowId = data.attributes.podcast[0].id;
              break;
            default:
              let value = data.attributes[key];

              if (key === 'title') value = utils.truncate(value, 52, { useSuffix: true });
              if (key === 'description') value = utils.truncate(value, 210, { useSuffix: true });
              element.innerText = value;
              break;
          }
        }
      }
      return clone.outerHTML;
    };
  }
  /**
   * takes in array of episodes and adds them to the episodesContainer
   * @param {Array} episodes // array of episodes
   * @param {Boolean} clearContainer // do you want to clear the container's html content
   */
  addMoreEpisodes(episodes, clearContainer = false) {
    const container = this.elements.episodesContainer;

    if (clearContainer) {
      container.innerHTML = '';
    }

    episodes.forEach( episode => {
      container.insertAdjacentHTML('beforeend', this.itemTemplate(episode));
    });
  }
  /**
   * method for hiding the load more btn
   */
  hideLoadMoreBtn() {
    this.elements.loadMoreBtn.style.display = 'none';
  }
  /**
   * method for showing the load more btn
   */
  showLoadMoreBtn() {
    this.elements.loadMoreBtn.style.display = 'block';
  }
}




/**
 * controller class for the client side component
 */
class PodcastListComponentController {
  /**
   * Create a controller instantiate the view and model and add the mount listener
   * @param {HTMLElement} containerElement - The HTMLElement of the component.
   */
  constructor(containerElement) {
    _bindAll(this, 'onMount', 'onDismount', 'onClick', 'onChange', 'onPlaybackStateChange');
    this.view = new PodcastListComponentView(containerElement);
    this.model = new PodcastListComponentModel(containerElement);
    doc.addEventListener(`${componentName}-mount`, this.onMount);
  }
  /**
   * mounting event handler
   */
  onMount() {
    this.view.elements.container.addEventListener('click' , this.onClick);
    this.view.elements.sortDropdown.addEventListener('change' , this.onChange);
    window.addEventListener('playbackStateChange', this.onPlaybackStateChange);
  }
  /**
   * click event handler
   * @param {Event} e // click event object
   */
  onClick(e) {
    if (this.model.isLoading) {
      return;
    }

    if (e.target === this.view.elements.loadMoreBtn) {
      this.model.isLoading == true;
      this.model.getEpisodes()
        .then(response => {
          const episodes = response._computed.episodes;

          this.model.pageNumber = this.model.pageNumber + 1;
          this.view.addMoreEpisodes(episodes);
          if (episodes.length < loadMoreAmount) {
            this.model.pageNumber = 2;
            this.view.hideLoadMoreBtn();
          }
        })
        .finally(()=> this.model.isLoading = false);
    }

    // to launch web player
    const playBtnEl = e.target.closest('.podcast-episode-list__play-btn');

    if (playBtnEl) {
      e.preventDefault();
      e.stopPropagation();
      const
        episodeId = playBtnEl.dataset.playPodcastEpisodeId,
        podcastId = playBtnEl.dataset.playPodcastShowId;

      clientCommunicationBridge
        .sendMessage(
          'SpaPlayerInterfacePlaybackStatus',
          { stationId: null, playbackStatus: 'play', podcastId, episodeId }
        );
    }
  }
  /**
   * change event handler
   * @param {Event} e // change event object
   */
  onChange(e) {
    if (this.model.isLoading) {
      return;
    }
    // need to reset the page number before the loading then increment after so
    // the load more will pick up in the right spot
    this.model.apiParams.sortOrder = sortingValues[e.target.value];
    this.model.apiParams.pageNumber = 1;
    this.model.isLoading = true;
    this.model.getEpisodes()
      .then(response => {
        this.view.addMoreEpisodes(response._computed.episodes, true);
        this.model.apiParams.pageNumber = 2;
      })
      .finally(()=> {
        this.model.isLoading = false;
        this.view.showLoadMoreBtn();
      });
  }
  /**
   * dismounting event handler
   */
  onDismount() {
    this.view.elements.container.removeEventListener('click' , this.onClick);
    this.view.elements.sortDropdown.removeEventListener('change' , this.onChange);
    doc.removeEventListener(`${componentName}-mount`, this.onMount);
  }

  onPlaybackStateChange(e) {
    const
      { podcastEpisodeId, playerState } = e.detail,
      targetBtn = $(`[data-play-podcast-episode-id="${podcastEpisodeId}"]`),
      webPlayerButtons = $$(`.${componentClassName}__play-btn`);

    webPlayerButtons.forEach(btn => {
      btn.classList.remove('show__play');
      btn.classList.remove('show__pause');
      if (btn === targetBtn) {
        btn.classList.add(`show__${playerState === 'pause' ? 'play' : 'pause'}`);
      }
    });
  }
}


module.exports = (el) => {
  $ = el.querySelector.bind(el); // quick alias isolated to the container el
  $$ = el.querySelectorAll.bind(el); // quick alias isolated to the container el
  return new PodcastListComponentController(el);
};
