'use strict';

module.exports = (type, data, content, options) => {
  return content.map(item => {
    const card = {
      title: item.primaryHeadline,
      track: {
        'page-uri': item.pageUri,
        headline: item.primaryHeadline,
        sectionFront: item.sectionFront,
        ...options.track
      },
      type,
      url: item.url
    };

    if (options.fields.includes('category')) {
      card.category = item.sectionFront;
    }

    if (options.fields.includes('thumb')) {
      const contentTypes = [], images = [];

      if (['youtube', 'brightcove'].includes(item.lead)) {
        contentTypes.push('watch');
      }

      if (item.lead === 'omny') {
        contentTypes.push('listen');
      }

      if (item.contentType === 'gallery') {
        contentTypes.push('gallery');
      }
      
      images.concat(options.imageSizes.map(size => ({
        url: item.feedImgUrl,
        crop: '16:9',
        offset: 'y0',
        ...size
      })));

      card.thumb = {
        contentTypes,
        images
      };
    }

    if (options.fields.includes('subTitle')) {
      card.subTitle = item.subHeadline;
    }

    if (options.fields.includes('postedTime')) {
      card.postedTime = item.date;
    }

    if (typeof options.generateActions === 'function') {
      card.actions = options.generateActions(item);
    }

    return card;
  });
};
