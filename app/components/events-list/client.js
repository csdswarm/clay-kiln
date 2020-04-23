'use strict';

const
  rest = require('../../services/universal/rest'),
  visibility = require('../../services/client/visibility');





/**
 * dom class for the component i.e. all things browser DOM related
 */
class EventsListDom {
  /**
   * Create a slider view.
   * @param {HTMLElement} containerElement - The HTMLElement of the component.
   * @param {HTMLElement} eventListController - The component controller.
   */
  constructor(containerElement, eventListController) {
    this.el = containerElement;
    this.cardsElement = this.el.querySelector('.events-list__cards');
    this.model = eventListController.model;
    this.loadMoreBtn = containerElement.querySelector('#events-list-load-more-button');
    this.cardElement = containerElement.querySelector('.content-card--event');
    this.cssTransitionTime = 200;
    this.initLazyLoad();
  }

  getCard(eventData) {
    const cardClone = this.cardElement.cloneNode(true);

    cardClone.setAttribute('data-height', this.cardElement.clientHeight + 'px');
    return this.cloneAndDecorateCard(cardClone, eventData);
  }

  cloneAndDecorateCard(cardClone, eventData) {
    // would love to be able to use component handlebars template but hbs not on client
    // and prob not worth adding at this point
    const
      cardCloneDom = {
        headline: cardClone.querySelector('.content-card__info-headline'),
        venueName: cardClone.querySelector('.content-card__info-venueName-text'),
        dateTime: cardClone.querySelector('.content-card__info-dateTime-text')
      },
      thumbPictureSourceElement = cardClone.querySelector('.content-card-thumb--event picture source'),
      thumbPictureImgElement = cardClone.querySelector('.content-card-thumb--event picture img');

    for (const key in cardCloneDom) {
      if (cardCloneDom[key] && eventData[key]) {
        const element = cardCloneDom[key];

        if (element) element.innerHTML = eventData[key];
      }
    }
    // set the href
    cardClone.setAttribute('href', eventData.url);
    // replace all the image refs
    if ( thumbPictureSourceElement && thumbPictureSourceElement) {
      thumbPictureSourceElement
        .setAttribute('srcset',
          thumbPictureSourceElement
            .getAttribute('srcset')
            .replace(/(^.*)(?=\?)/, eventData.feedImgUrl)
        );
      thumbPictureImgElement
        .setAttribute(
          'src',
          thumbPictureImgElement
            .getAttribute('src')
            .replace(/(^.*)(?=\?)/, eventData.feedImgUrl)
        );
    }
    return cardClone;
  }

  addCard(eventData, index) {
    const card = this.getCard(eventData);

    this.cardsElement.appendChild(card);
    card.classList.add('load-more');
    setTimeout(() => {
      // delay addition of done class which will trigger a transition in the css
      card.classList.add('load-more--done');
      card.style.height = card.getAttribute('data-height');
      // set back after animation in case user changes width - must be > css:transition
      setTimeout(() => card.style.height = 'initial', this.model.cssTransitionTime + 50);
    }, index * 150);
  }

  hideLoadMoreBtn() {
    this.loadMoreBtn.classList.add('events-list__load-more-btn--hidden');
  }

  initLazyLoad() {
    // this will basically load two pages of whatever the loadMoreAmount is set to in the component settings then remove the visibility listener
    this.loadMoreVisibility = new visibility.Visible(this.loadMoreBtn, { shownThreshold: 0.05 });
    this.loadMoreBtn.style.visibility = 'hidden';
    this.loadMoreVisibility.on('shown', () => {
      if (this.model.pageNumber <= this.model.maxLazyLoadedPages) {
        this.loadMoreBtn.click();
      } else {
        this.loadMoreVisibility.destroy();
        this.loadMoreBtn.style.visibility = 'visible';
      }
    });
  }
}






/**
 * data model class for the component
 */
class EventsListModel {
  /**
   * Create a slider view.
   * @param {HTMLElement} containerElement - The HTMLElement of the component.
   * @param {HTMLElement} eventListController - The component controller.
   */
  constructor(containerElement, eventListController) {
    this.ctrl = eventListController;
    this.pageNumber = 1;
    this.maxLazyLoadedPages = 2;
    this.isLoading = false;
    this.moreContentUrl = '//' + containerElement.getAttribute('data-uri').replace('@published', '');
    this.loadMoreAmount = containerElement.getAttribute('data-load-more-amount');
  }
}








/**
 * controller for the client side component
 */
class EventsListController {
  /**
   * Create a slider view.
   * @param {HTMLElement} containerElement - The HTMLElement of the component.
   */
  constructor(containerElement) {
    this.model = new EventsListModel(containerElement, this);
    this.dom = new EventsListDom(containerElement, this);
    // bind the event listener methods do this context for removal on dismount
    this.onClick = this.onClick.bind(this);
    // add the Vue mounting listeners
    document.addEventListener('events-list-mount', e => this.onMount(e));
    document.addEventListener('events-list-dismount', e => this.onDismount(e));
  }

  onMount() {
    if (this.dom.loadMoreBtn) {
      this.dom.loadMoreBtn.addEventListener('click', this.onClick);
      this.dom.hasListener = true;
    }
  }

  onDismount() {
    // remove the local listeners on Vue dismount
    if (this.dom.hasListener) {
      this.dom.loadMoreBtn.removeEventListener('click', this.onClick);
    }
  }

  onClick() {
    // short circuit if currently loading
    if (this.model.isLoading) return;
    // now begin loading sequence
    this.model.isLoading = true;
    rest.get(`${this.model.moreContentUrl}?page=${this.model.pageNumber}`)
      .then(responseData => {
        const moreEvents = responseData._computed.moreEvents;

        if (moreEvents.length < this.model.loadMoreAmount) {
          // nothing to add
          this.dom.hideLoadMoreBtn();
          return;
        }
        this.model.isLoading = false;
        this.model.pageNumber++;
        moreEvents.forEach((eventData, i) => {
          this.dom.addCard(eventData, i);
        });
      })
      .catch(err => {
        this.model.isLoading = false;
        console.error(err);
      });
  }
}

module.exports = el => new EventsListController(el);
