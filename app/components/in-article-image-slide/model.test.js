'use strict';

var expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);


describe(dirname, function () {
  describe(filename, function () {
    describe('save', function () {
      let fn = lib[this.title],
        uri = 'domain.com/_components/in-article-image-slide/instances/foo';


      it('renders per-instance styles', function () {
        return fn(uri, { sass: 'border:1px solid #000;' }).then(function (result) {
          expect(result).to.eql({ sass: 'border:1px solid #000;', css: `[data-uri="${uri}"]{border:1px solid #000}`});
        });
      });

      it('deletes css if sass is deleted', function () {
        expect(fn(uri, {sass: ''}).css).to.be.empty;
      });

      it('does not sanitize the caption for spans', () => {
        return fn(uri, {
          imageCaption: '<span>Hello</span>'
        }).then((result) => {
          expect(result.imageCaption).to.equal('<span>Hello</span>');
        });
      });

      it('does not sanitize the caption for italics', () => {
        return fn(uri, {
          imageCaption: '<em>Hello</em>'
        }).then((result) => {
          expect(result.imageCaption).to.equal('<em>Hello</em>');
        });
      });

      it('does not sanitize the caption for bold', () => {
        return fn(uri, {
          imageCaption: '<strong>Hello</strong>'
        }).then((result) => {
          expect(result.imageCaption).to.equal('<strong>Hello</strong>');
        });
      });

      it('gets an image with a 670px wide and 447px tall if slideshowWidth is small and imageDisplay is horizontal', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'horizontal',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'small',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.w670.h447.2x.jpg'));

      });

      it('gets an image with a 2147483647px wide and 447px tall if slideshowWidth is small and imageDisplay is vertical', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'vertical',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'small',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.nocrop.w2147483647.h447.2x.jpg'));

      });

      it('gets an image with a 670px wide and 2147483647px tall if slideshowWidth is small and imageDisplay is flex', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'flex',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'small',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.nocrop.w670.h2147483647.2x.jpg'));

      });

      it('gets an image with a 800px wide and 533px tall if slideshowWidth is medium and imageDisplay is horizontal', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'horizontal',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'medium',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.w800.h533.2x.jpg'));

      });

      it('gets an image with a 2147483647px wide and 533px tall if slideshowWidth is medium and imageDisplay is vertical', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'vertical',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'medium',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.nocrop.w2147483647.h533.2x.jpg'));

      });

      it('gets an image with a 800px wide and 2147483647px tall if slideshowWidth is medium and imageDisplay is flex', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'flex',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'medium',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.nocrop.w800.h2147483647.2x.jpg'));

      });

      it('gets an image with a 900px wide and 600px tall if slideshowWidth is large and imageDisplay is horizontal', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'horizontal',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'large',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.w900.h600.2x.jpg'));

      });

      it('gets an image with a 2147483647px wide and 600px tall if slideshowWidth is large and imageDisplay is vertical', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'vertical',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'large',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.nocrop.w2147483647.h600.2x.jpg'));

      });

      it('gets an image with a 900px wide and 2147483647px tall if slideshowWidth is large and imageDisplay is flex', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'flex',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'large',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.nocrop.w900.h2147483647.2x.jpg'));

      });

      it('gets an image with a 1200px wide and 800px tall if slideshowWidth is extra-large and imageDisplay is horizontal', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'horizontal',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'extra-large',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.w1200.h800.2x.jpg'));

      });

      it('gets an image with a 2147483647px wide and 800px tall if slideshowWidth is extra-large and imageDisplay is vertical', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'vertical',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'extra-large',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.nocrop.w2147483647.h800.2x.jpg'));

      });

      it('gets an image with a 1200px wide and 2147483647px tall if slideshowWidth is extra-large and imageDisplay is flex', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'flex',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'extra-large',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.nocrop.w1200.h2147483647.2x.jpg'));

      });

      it('gets an image with a 1600px wide and 1067px tall if slideshowWidth is super-extra-large and imageDisplay is horizontal', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'horizontal',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'super-extra-large',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.w1600.h1067.2x.jpg'));

      });

      it('gets an image with a 2147483647px wide and 1067px tall if slideshowWidth is super-extra-large and imageDisplay is vertical', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'vertical',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'super-extra-large',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.nocrop.w2147483647.h1067.2x.jpg'));

      });

      it('gets an image with a 1200px wide and 2147483647px tall if slideshowWidth is super-extra-large and imageDisplay is flex', function () {
        let current = {
          imageURL: 'https://pixel.nymag.com/imgs/image.jpg',
          slideDisplay: 'flex',
          imageCaption: null,
          imageCredit: '',
          slideWidth: 'super-extra-large',
          css: ''

        };

        return fn(uri, current).then(result => expect(result.imageURL).to.equal('https://pixel.nymag.com/imgs/image.nocrop.w1600.h2147483647.2x.jpg'));

      });

    });
  });
});


