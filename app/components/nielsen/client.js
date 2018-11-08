'use strict';

// mount listener for vue (optional)
document.addEventListener('nielsen-mount', function(event) {
    // code to run when vue mounts/updates, aka after a new "pageview" has loaded.
    document.addEventListener('click', function(e) {
      console.log("clicked");
    });
});

class NielsenMarketingCloud {

    constructor (element) {}

    updatePixel(updatedData) {
      this.nielsenUrl = '//loadus.exelator.com/load/?';
      this.params = {
        'p': updatedData.p || '1149',
        'g': updatedData.g || '5',
        'podcast': updatedData.podcast || '',
        'blog': updatedData.blog || '',
        'livestreamplayer': updatedData.livestreamplayer || '',
        'pid': updatedData.pid || '',
        'station': updatedData.station || 'NATL-RC', // 'station' value should be the station slug when available
        'keyword': updatedData.keyword || '',
        'mkt': updatedData.mkt || 'Corporate', // location - market value
        'tag': updatedData.tag || '',
        'author': updatedData.author || '',
        'genre': updatedData.genre || '', // value should be station genres (comma separated for multiple genres)
        'team': updatedData.team || '',
        'format': updatedData.format || '', // station category
        'ctg': updatedData.ctg || '',
      };
      this.nielsenUrl += this.params.keys(params).map(function(paramName) {
        return encodeURIComponent(paramName) + '=' + encodeURIComponent(params[paramName])
      }).join('&');
      this.updateTag();
    }

    updateTag() {
      const head = document.querySelector('head');
      let nielsenMarketingCloudTag = document.querySelector('.nielsen-marketing-pixel');

      if (nielsenMarketingCloudTag) {
        head.removeChild(nielsenMarketingCloudTag);
      }
      nielsenMarketingCloudTag = document.createElement('script');
      nielsenMarketingCloudTag.classList.add('nielsen-marketing-pixel');
      nielsenMarketingCloudTag.src = this.nielsenUrl;
      head.appendChild(nielsenMarketingCloudTag);
    }

};
