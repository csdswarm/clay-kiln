'use strict';

const
  rest = require('../../services/universal/rest'),
  doc = document,
  componentName = 'podcast-episode-list';

let
  $, $$;

class PodcastListComponentModel {
  constructor(containerElement) {
    this.isLoading = false;
    this.pageNumber = 1;
    this.apiEndpoint = '//' + containerElement.getAttribute('data-uri').replace('@published', '');
  }
  get api() {
    return `${this.apiEndpoint}?page=${this.pageNumber}`;
  }
}

class PodcastListComponentView {
  constructor(el) {
    this.elements = {
      container: el,
      sortDropdown: $('#episodesOrder')
    };
  }
}

class PodcastListComponent {
  constructor(el) {
    this.onMount = this.onMount.bind(this);
    this.onDismount = this.onDismount.bind(this);
    this.onClick = this.onClick.bind(this);
    this.view = new PodcastListComponentView(el);
    this.model = new PodcastListComponentModel(el);
    doc.addEventListener(`${componentName}-mount`, this.onMount);
  }
  onMount() {
    console.log('[mount]', 'PodcastListComponent', this);
    this.view.elements.container.addEventListener('click' , this.onClick);
  }
  onClick(e) {
    console.log('click', e);
    rest.get(this.model.api())
      .then(response => console.log(response));
  }
  onDismount() {
    console.log('[dismount]', 'PodcastListComponent');
  }
}



module.exports = (el) => {
  $ = el.querySelector.bind(el);
  $$ = el.querySelectorAll.bind(el);
  return new PodcastListComponent(el);
};
