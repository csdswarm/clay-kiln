'use strict';

class NielsenMarketingCloud {
  constructor() {
    this.initialParams = {
      p: '1149',
      g: '5',
      podcast: '',
      blog: '',
      livestreamplayer: 'player',
      pid: '',
      station: 'NATL-RC', // 'station' value should be the station slug when available
      keyword: '',
      mkt: 'Corporate', // location - market value
      tag: '',
      author: '',
      genre: '', // value should be station genres (comma separated for multiple genres)
      team: '',
      format: '', // section front
      ctg: '' // section front?
    };
  }
  /**
  * Process payload of components on page,
  * pulling what we need into an updated object.
  * @function
  * @param {object} spaPayload
  */
  parseSPAPayload(spaPayload) {
    let updatedData = {};

    if (spaPayload.main[0]['_ref'].indexOf('article') !== -1) {
      updatedData.tag = spaPayload.main[0].tags.items.map((tag) => {return tag.text;}).join(',');
      updatedData.author = spaPayload.main[0].authors.join(',');
      updatedData.format = updatedData.ctg = spaPayload.main[0].articleType;
    } else if (spaPayload.main[0]['_ref'].indexOf('station-detail') !== -1) {
      updatedData.station = spaPayload.main[0].station;
      updatedData.keyword = spaPayload.main[0].keyword;
      updatedData.mkt = spaPayload.main[0].market;
      updatedData.genre = spaPayload.main[0].genre;
      updatedData.format = updatedData.ctg = spaPayload.main[0].sectionFront;
    } else if (spaPayload.main[0]['_ref'].indexOf('tag-page') !== -1) {
      updatedData.tag = spaPayload.pageHeader[1].tag;
    } else if (spaPayload.main[0]['_ref'].indexOf('section-front') !== -1) {
      updatedData.format = updatedData.ctg = spaPayload.main[0].title;
    }
    this.updateParams(updatedData);
  }
  /**
  * Updates params to be appended to nielsen url.
  * @function
  * @param {object} updatedData
  */
  updateParams(updatedData) {
    this.params = this.initialParams;
    this.nielsenUrl = '//loadus.exelator.com/load/?';
    this.params = {
      p: updatedData.p || '1149',
      g: updatedData.g || '5',
      podcast: updatedData.podcast || '',
      blog: updatedData.blog || '',
      livestreamplayer: updatedData.livestreamplayer || 'player',
      pid: updatedData.pid || '',
      station: updatedData.station || 'NATL-RC',
      keyword: updatedData.keyword || '',
      mkt: updatedData.mkt || 'Corporate',
      tag: updatedData.tag || '',
      author: updatedData.author || '',
      genre: updatedData.genre || '',
      team: updatedData.team || '',
      format: updatedData.format || '',
      ctg: updatedData.ctg || ''
    };
    this.nielsenUrl += Object.keys(this.params).map(function (paramName) {
      return encodeURIComponent(paramName) + '=' + encodeURIComponent(this.params[paramName]);
    }.bind(this)).join('&');
    this.updatePixel();
  }
  /**
  * Removes any existing nielsen pixel and
  * replaces with new script with new src.
  * @function
  */
  updatePixel() {
    const nielsen = document.querySelector('.component--nielsen');
    let nielsenPixel = nielsen.querySelector('.nielsen__marketing-cloud-pixel');

    if (nielsenPixel) {
      nielsen.removeChild(nielsenPixel);
    }
    if (nielsen) {
      nielsenPixel = document.createElement('script');
      nielsenPixel.classList.add('nielsen__marketing-cloud-pixel');
      nielsenPixel.src = this.nielsenUrl;
      nielsen.appendChild(nielsenPixel);
    }
  }
};

const nielsen = new NielsenMarketingCloud();
let spaPayload;

(() => {
  const jsonPayload = atob(window.spaPayload);

  spaPayload = JSON.parse(jsonPayload);
  document.addEventListener('nielsen-mount', function () {
    nielsen.parseSPAPayload(spaPayload);
  });
})();
document.addEventListener('pageView', function (event) {
  spaPayload = event.detail;
});
