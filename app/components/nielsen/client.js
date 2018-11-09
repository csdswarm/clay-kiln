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
  parseSPAPayload(spaPayload) {
    let updatedData = {};

    if (spaPayload.main[0]['_ref'].indexOf('article') !== -1) {
      updatedData.tag = spaPayload.main[0].tags.items.map((tag)=>{return tag.text;}).join(',');
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
    this.updatePixel(updatedData);
  }
  updatePixel(updatedData) {
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
    this.updateTag();
  }
  updateTag() {
    console.log('update tag with url', this.nielsenUrl);
    const nielsenHeadComponent = document.querySelector('.component--nielsen'),
      footer = document.querySelector('footer');

    footer.setAttribute('test','hai');
    let nielsenMarketingCloudTag = nielsenHeadComponent.querySelector('.nielsen__marketing-cloud-pixel');

    if (nielsenMarketingCloudTag) {
      nielsenHeadComponent.removeChild(nielsenMarketingCloudTag);
      console.log('remove script');
    }
    nielsenMarketingCloudTag = document.createElement('script');
    nielsenMarketingCloudTag.classList.add('nielsen__marketing-cloud-pixel');
    nielsenMarketingCloudTag.setAttribute('src', this.nielsenUrl);
    nielsenHeadComponent.appendChild(nielsenMarketingCloudTag);
    console.log(nielsenHeadComponent, nielsenMarketingCloudTag);
  }
};

const nielsen = new NielsenMarketingCloud();

(()=>{
  const jsonPayload = window.Base64.decode(window.spaPayload),
    spaPayload = JSON.parse(jsonPayload);

  console.log('initial page load');
  nielsen.parseSPAPayload(spaPayload);
})();
document.addEventListener('pageView', function (event) {
  console.log('page view event');
  nielsen.parseSPAPayload(event.detail);
});
