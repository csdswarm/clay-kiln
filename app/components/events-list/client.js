'use strict';

const
  rest = require('../../services/universal/rest');


class EventsListDom {
  constructor(el, model) {
    this.el = el;
    this.cardsElement = this.el.querySelector('.events-list__cards'),
    this.model = model;
    this.loadMoreBtn = el.querySelector('#events-list-load-more-button'),
    this.cardElement = el.querySelector('.content-card--event');
  }
  onLoadMore() {
    console.log('[onLoadMore]', 'onLoadMore');
    // short circuit is currently loading
    if (this.model.isLoading) return;

    this.isLoading = true;
    rest.get(`${this.model.moreContentUrl}?page=${this.model.pageNumber}`)
      .then(responseData => {
        console.log('[responseData]', responseData);
        this.model.isLoading = false;
        this.model.pageNumber++;
        responseData._computed.moreEvents.forEach(eventData => {
          this.cardsElement.appendChild(this.getCard(eventData));
        });
      })
      .catch(err => {
        this.model.isLoading = false;
        console.error(err);
      });
  }

  getCard(eventData) {
    console.log('[eventData]', eventData);

    return this.cloneAndDecorateCard(this.cardElement.cloneNode(true), eventData);
  }

  cloneAndDecorateCard(cardClone, eventData) {
    const
      cardCloneDom = {
        headline: cardClone.querySelector('.content-card__info-headline'),
        venueName: cardClone.querySelector('.content-card__info-venueName-text'),
        dateTime: cardClone.querySelector('.content-card__info-dateTime-text')
      },
      thumbPictureSourceElement = cardClone.querySelector('.content-card-thumb--event picture source'),
      thumbPictureImgElement = cardClone.querySelector('.content-card-thumb--event picture img');

    for (const key in cardCloneDom) {
      if (cardCloneDom.hasOwnProperty(key) && eventData.hasOwnProperty(key)) {
        const element = cardCloneDom[key];

        if (element) element.innerHTML = eventData[key];
      }
    }

    // replace all the image refs
    if ( thumbPictureSourceElement && thumbPictureSourceElement) {
      thumbPictureSourceElement.setAttribute('srcset', thumbPictureSourceElement.getAttribute('srcset').replace(/(^.*)(?=\?)/, eventData.feedImgUrl));
      thumbPictureImgElement.setAttribute('src', thumbPictureImgElement.getAttribute('src').replace(/(^.*)(?=\?)/, eventData.feedImgUrl));
    }
    return cardClone;
  }
}

/**
 *
 */
class EventsList {
  constructor(el) {
    this.dom = new EventsListDom(el, this);
    this.pageNumber = 1;
    this.isLoading = false;
    this.moreContentUrl = '//' + this.dom.el.getAttribute('data-uri').replace('@published', '');
    // bind the event listener methods do this context for removal on dismount
    this.onClick = this.onClick.bind(this);
    // add the Vue mounting listeners
    document.addEventListener('events-list-mount', e => this.onMount(e));
    document.addEventListener('events-list-dismount', e => this.onDismount(e));
  }

  onMount(e) {
    //
    console.log('[MOUNT]', e);
    if (this.dom.loadMoreBtn) {
      this.dom.loadMoreBtn.addEventListener('click', this.onClick);
    }
  }

  onDismount() {
    // remove the local listeners once Vue dismounts
  }

  onClick() {
    this.dom.onLoadMore();
  }
}

module.exports = el => new EventsList(el);
