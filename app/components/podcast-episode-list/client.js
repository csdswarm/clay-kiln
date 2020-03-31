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
  loadMoreAmount = 20;

let
  $; // , $$;

class PodcastListComponentModel {
  constructor(containerElement) {
    this.isLoading = false;
    this.apiParams = {
      dynamicSlug: containerElement.getAttribute('data-dynamic-slug'),
      sortOrder: sortingValues[1],
      pageNumber: 2
    };
    this.apiEndpoint = '//' + containerElement.getAttribute('data-uri').replace('@published', '');
  }
  set pageNumber(value) {
    this.apiParams.pageNumber = value;
  }
  get pageNumber() {
    return this.apiParams.pageNumber;
  }
  getApiUrl(isLoadMoreRequest) {
    const serialized = qs.stringify({
      query: {
        page: this.apiParams.pageNumber,
        sort: !isLoadMoreRequest ? this.apiParams.sortOrder : this.getOppositeSortOrder()
      },
      params: {
        dynamicSlug: this.apiParams.dynamicSlug
      }
    });

    return `${this.apiEndpoint}?${serialized}`;
  }
  getOppositeSortOrder() {
    if (this.apiParams.sortOrder === sortingValues[0]) {
      return sortingValues[1];
    }
    return sortingValues[0];
  }
  getEpisodes(isLoadMoreRequest = false) {
    return rest.get(
      this.getApiUrl(isLoadMoreRequest)
    );
  }
}

class PodcastListComponentView {
  constructor(el) {
    this.elements = {
      container: el,
      sortDropdown: $('#episodesOrder'),
      episodesContainer: $(`.${componentClassName}__episodes`),
      loadMoreBtn: $(`.${componentClassName}__load-more-btn`)
    };
    this.itemTemplate = this.getHtmlTemplateFromClone();
  }
  getHtmlTemplateFromClone() {
    const
      clone = this.elements.episodesContainer.children[0].cloneNode(true),
      cloneElements = {
        image:                      clone.querySelector(`.${componentClassName}__image`),
        link:                       clone.querySelector(`.${componentClassName}__download-link`),
        published_date_formatted:   clone.querySelector(`.${componentClassName}__pub-date`),
        duration_seconds_formatted: clone.querySelector(`.${componentClassName}__duration span`),
        title:                      clone.querySelector(`.${componentClassName}__title`),
        description:                clone.querySelector(`.${componentClassName}__description`)
      };

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
            default:
              let value = data.attributes[key];

              if (key === 'description') value = utils.truncate(value, 60, { useSuffix: true });
              element.innerText = value;
              break;
          }
        }
      }
      return clone.outerHTML;
    };
  }
  addMoreEpisodes(episodes, clearContainer = false) {
    const container = this.elements.episodesContainer;

    if (clearContainer) {
      container.innerHTML = '';
    }

    episodes.forEach( episode => {
      container.insertAdjacentHTML('beforeend', this.itemTemplate(episode));
    });
  }
  hideLoadMoreBtn() {
    this.elements.loadMoreBtn.style.display = 'none';
  }
  showLoadMoreBtn() {
    this.elements.loadMoreBtn.style.display = 'block';
  }
}

class PodcastListComponent {
  constructor(el) {
    _bindAll(this, 'onMount', 'onDismount', 'onClick', 'onChange');
    this.view = new PodcastListComponentView(el);
    this.model = new PodcastListComponentModel(el);
    doc.addEventListener(`${componentName}-mount`, this.onMount);
  }
  onMount() {
    console.log('[mount]', 'PodcastListComponent', this);
    this.view.elements.container.addEventListener('click' , this.onClick);
    this.view.elements.sortDropdown.addEventListener('change' , this.onChange);
  }
  onClick(e) {
    if (this.model.isLoading) {
      return;
    }
    if (e.target === this.view.elements.loadMoreBtn) {
      console.log('MORE!');
      this.model.isLoading == true;
      this.model.getEpisodes()
        .then(response => {
          const episodes = response._computed.episodes;

          console.log(episodes);
          this.model.isLoading == false;
          this.model.pageNumber = this.model.pageNumber + 1;
          this.view.addMoreEpisodes(episodes);
          if (episodes.length < loadMoreAmount) {
            this.model.pageNumber = 2;
            this.view.hideLoadMoreBtn();
          }
        });
    }
  }
  onChange(e) {
    this.model.apiParams.sortOrder = sortingValues[e.target.value];
    this.model.apiParams.pageNumber = 2;
    this.model.getEpisodes()
      .then(response => {
        console.log(response);
        this.view.addMoreEpisodes(response._computed.episodes, true);
        this.view.showLoadMoreBtn();
      });
  }
  onDismount() {
    console.log('[dismount]', 'PodcastListComponent');
  }
}



module.exports = (el) => {
  $ = el.querySelector.bind(el);
  // $$ = el.querySelectorAll.bind(el);
  return new PodcastListComponent(el);
};
