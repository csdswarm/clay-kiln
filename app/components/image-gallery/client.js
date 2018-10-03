// // Allow this to pass eslint complexity rule
// /* eslint complexity: ["error", 30] */
// 'use strict';
//
// const dom = require('@nymag/dom'),
//   Hammer = require('hammerjs');
//
// DS.controller('image-gallery', ['$window', '_', '$visibility', function ($window, _, $visibility) {
//   var largeWidthBreakpoint = 1180,
//     mediumWidthBreakpoint = 768,
//     navHeight = 55,
//     desktopListGutter = 116;
//
//   function Constructor(el) {
//     var navWrapper = dom.find(el, '.nav-container'),
//       nav = dom.find(el, '.image-gallery-nav'),
//       mainContent = dom.find('section.main'),
//       vm = this;
//
//     this.nav = nav;
//     this.navWrapper = navWrapper;
//     this.images = dom.findAll(el, '.image-gallery-image');
//     this.gallery = dom.find(el, '.gallery');
//     this.listButton = dom.find(el, 'button[data-view="list"]');
//     this.gridButton = dom.find(el, 'button[data-view="grid"]');
//     this.positionCounter = dom.find(el, '.gal-position');
//     this.modalCounter = dom.find(el, '.modal-counter-index');
//     this.gridStyles = dom.find(el, 'style.grid-styles');
//     this.modal = dom.find(el, '.modal');
//     this.hammerTime = new Hammer(this.modal);
//     this.modalBody = dom.find(this.modal, '.modal-body');
//     this.el = el;
//     this.noScroll = require('no-scroll');
//     this.cachedGrids = {};
//     this.desktopAd = dom.find(el, '.image-gallery-desktop-list-ad .ad');
//     this.pageYOffset = 0;
//     this.pins = [];
//     this.hammerTime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
//     this.hammerTime.on('swipeup', this.closeModal.bind(this));
//
//     function handleScroll() {
//       if (!mainContent.classList.contains('hidden-component')) {
//         nav.classList.toggle('sticky', navWrapper.getBoundingClientRect().top <= 0 && $window.scrollY < el.getBoundingClientRect().bottom + $window.scrollY);
//
//         this.updateCurrentImage();
//       }
//     }
//
//     function handleResize() {
//       if (this.currentView === 'grid') {
//         this.recalculateGrid();
//       } else if (this.currentView === 'list') {
//         if ($window.innerWidth >= largeWidthBreakpoint && !this.pins.length) {
//           this.setPins();
//         }
//       }
//
//       this.updateCurrentImage();
//     }
//
//     this.setView('list');
//     $window.addEventListener('scroll', _.throttle(handleScroll.bind(this), 33)); // 30fps
//     $window.addEventListener('resize', _.throttle(handleResize.bind(this), 33)); // 30fps
//     document.addEventListener('keydown', this.handleModalKeydown.bind(this));
//     document.addEventListener('transitionend', this.handleTransitionEnd.bind(this));
//     document.addEventListener('readystatechange', function () {
//       if (document.readyState === 'complete' && $window.innerWidth >= largeWidthBreakpoint) { // only set the pins once everything on the page is loaded so we know where their tops should be
//         vm.setPins();
//       }
//     });
//   }
//
//   Constructor.prototype = {
//     events: {
//       '.image-gallery-nav button.gallery-toggle click': 'toggleView',
//       '.image-gallery-nav button.to-top click': 'goToTop',
//       '.gallery .image-gallery-image click': 'openImageInModal',
//       '.gallery .image-gallery-image .focus-trigger click': 'openImageInModal',
//       '.modal .modal-body click': 'closeModal',
//       '.modal .close-button click': 'closeModal',
//       '.modal .back-button click': 'closeModal'
//     },
//     toggleView: function (e) {
//       var el = dom.closest(e.target, 'button.gallery-toggle'),
//         targetView = el.getAttribute('data-view');
//
//       if (targetView !== this.currentView) {
//         this.setView(targetView);
//       }
//     },
//     goToTop: function () {
//       this.navWrapper.scrollIntoView();
//     },
//     updateCurrentImage: function () {
//       var closestIndex;
//
//       if (this.currentView === 'list') {
//         closestIndex = this.getCurrentListImage();
//       } else if (this.currentView === 'grid') {
//         closestIndex = this.getCurrentGridImage();
//       }
//
//       if (closestIndex != this.currentImageIndex) {
//         if (this.currentImage) {
//           this.currentImage.classList.remove('active');
//         }
//         this.currentImage = this.images[closestIndex];
//         this.currentImage.classList.add('active');
//         this.currentImageIndex = closestIndex;
//         this.positionCounter.innerHTML = closestIndex + 1;
//       }
//     },
//     getCurrentListImage: function () {
//       var closestIndex = 0, i, image, rect, lastClosestDistance, distance;
//
//       for (i = 0; i < this.images.length; i++) {
//         image = this.images[i];
//         rect = image.getBoundingClientRect();
//         distance = Math.abs(rect.top + rect.bottom / 2 - ($window.innerHeight * 0.5 + navHeight));
//         if (lastClosestDistance && distance > lastClosestDistance) {
//           break;
//         }
//         lastClosestDistance = distance;
//         closestIndex = i;
//       }
//
//       return closestIndex;
//     },
//
//     getCurrentGridImage: function () {
//       var i, image, rect;
//
//       for (i = 0; i < this.images.length; i++) {
//         image = this.images[i];
//         rect = image.getBoundingClientRect();
//         if (rect.top >= 0) {
//           return i;
//         }
//       }
//
//       return this.images.length - 1; // return the last image if we're below the top of all the images
//     },
//
//     isHorizontal: function (img) {
//       return img.classList.contains('horizontal');
//     },
//     createPinnedAd: function (pin) {
//       var ad = document.createElement('div');
//
//       ad.classList.add('ad', 'vp-1180-plus', 'gallery-list-ad');
//       ad.setAttribute('data-name', '/4088/nym.thecut');
//       ad.setAttribute('data-sizes', '300x600,300x250');
//       ad.setAttribute('data-label', 'cutGalleryListDesktop');
//       ad.setAttribute('data-offload', true);
//       ad.setAttribute('id', 'ad-cid-' + _.random(1000));
//       ad.setAttribute('data-site', 'TheCut');
//
//       DS.get('ad', ad);
//
//       pin.adContainer = document.createElement('div');
//       pin.adContainer.classList.add('image-gallery-desktop-list-ad');
//       pin.adContainer.style.top = pin.relativeTop + 'px';
//       pin.adContainer.style.height = pin.relativeBottom - pin.relativeTop + 'px';
//       pin.adContainer.appendChild(ad);
//
//       this.gallery.appendChild(pin.adContainer);
//     },
//     setPins: function () {
//       var currentPin = {},
//         vm = this,
//         img;
//
//       if (this.pins.length > 0) { // remove existing pins before setting new ones
//         this.pins.forEach(function (pin) {
//           vm.gallery.removeChild(pin.adContainer);
//         });
//
//         this.pins = [];
//       }
//
//       this.images.forEach(function (img, idx) {
//         if (!vm.isHorizontal(img) && !currentPin.top) {
//           if (idx === 0 || vm.isHorizontal(vm.images[idx - 1])) {
//             currentPin.top = img.getBoundingClientRect().top + $window.scrollY;
//             currentPin.relativeTop = img.offsetTop;
//           }
//         } else if (idx > 0 && vm.isHorizontal(img) && !currentPin.bottom && !vm.isHorizontal(vm.images[idx - 1])) {
//           currentPin.relativeBottom = img.offsetTop - desktopListGutter;
//           currentPin.bottom = img.getBoundingClientRect().top + $window.scrollY;
//           vm.pins.push(currentPin);
//
//           vm.createPinnedAd(currentPin);
//           currentPin = {};
//         }
//       });
//
//       if (currentPin.top && !currentPin.bottom) { // if the last photo is vertical
//         img = this.images[this.images.length - 1];
//         currentPin.relativeBottom = img.offsetTop + img.offsetHeight;
//         currentPin.bottom = img.getBoundingClientRect().bottom + $window.scrollY;
//
//         vm.pins.push(currentPin);
//         vm.createPinnedAd(currentPin);
//       }
//     },
//     setView: function (view) {
//       var self = this, left, top;
//
//       this.currentView = view;
//
//       if (this.listButton && this.gridButton) {
//         this.listButton.disabled = view === 'list';
//         this.listButton.setAttribute('aria-pressed', view === 'list');
//         this.gridButton.disabled = view === 'grid';
//         this.gridButton.setAttribute('aria-pressed', view === 'grid');
//       }
//
//       this.gallery.classList.toggle('grid', view === 'grid');
//       this.nav.classList.toggle('grid', view === 'grid');
//
//       if (view === 'grid') {
//         this.recalculateGrid();
//       }
//
//       if (this.currentImage && this.el.getBoundingClientRect().top <= 0) {
//         left = $window.scrollX;
//         top = $visibility.getPageOffset(this.currentImage).top - navHeight;
//         setTimeout(function () {
//           $window.scrollTo(left, top);
//           $visibility.updateVisibility();
//           self.updateCurrentImage();
//         }, 10);
//       } else {
//         $visibility.updateVisibility();
//         this.updateCurrentImage();
//       }
//     },
//     /* Buckle up cause this one's a doozy.
//     Grid view for image galleries uses a pretty unique staggered layout as requested by design.  It goes a little something like this:
//
//     Mobile/Tablet (Small/Medium)
//     *******  *******
//     *     *  *     *
//     *     *  *     *
//     *     *  *******
//     *******
//              *******
//     *******  *     *
//     *     *  *     *
//     *     *  *     *
//     *******  *******
//
//     Desktop (Large)
//     *******  *******  *******
//     *     *  *     *  *     *
//     *     *  *     *  *     *
//     *     *  *******  *     *
//     *******           *******
//              *******
//     *******  *     *  *******
//     *     *  *     *  *     *
//     *     *  *     *  *     *
//     *******  *******  *******
//
//     Try as we might, we couldn't find a way to build this responsively using either floats, flexbox, or grid view.  So we've resorted to absolutely
//     positioning elements using CSS we generate based on the viewport width.  If you're modifying or fixing a bug with this, I'd reccomend reaching out
//     to Byron or Zoe to pair up.  */
//     generateGridCSS: function (galleryWidth, breakpoint) {
//       // Configurations for the layouts based for small, medium, and large breakpoints
//       var gridConfigsByBreakpoint = {
//           small: {
//             columns: 2, // the number of columns for the layout
//             gutterSize: 20, // the margin between images, both horizontally and vertically
//             adGutterSize: 37, // the margin between images and ads
//             adHeight: 250, // the maximum possible height of an ad which will be used in grid view. Small ads should be vertically centered in this space
//             imagesInGroup: 4, // how many images are in a grouping
//             imagesPerAd: 12 // after how many images should an ad be displayed.  This needs to line up with how often an ad is inserted in the template.handlebars
//           },
//           medium: {
//             columns: 2,
//             gutterSize: 38,
//             adGutterSize: 68,
//             adHeight: 90,
//             imagesInGroup: 4,
//             imagesPerAd: 12
//           },
//           large: {
//             columns: 3,
//             gutterSize: 30,
//             adGutterSize: 64,
//             adHeight: 250,
//             imagesInGroup: 6,
//             imagesPerAd: 12
//           }
//         },
//         gridConfig = gridConfigsByBreakpoint[breakpoint],
//         newCSS = '',
//         imagesIndex,
//         smallAspectRatio = 1,
//         largeAspectRatio = 157 / 236, // taken from the designs
//         imageWidth = (galleryWidth - gridConfig.gutterSize * (gridConfig.columns - 1)) / gridConfig.columns,
//         smallImageHeight = imageWidth / smallAspectRatio,
//         largeImageHeight = imageWidth / largeAspectRatio,
//         cursorX = 0, // To generate our css we use a "cursor" which goes down the page, laying out each image from the top-left.
//         cursorY = 0;
//
//       for (imagesIndex = 0; imagesIndex < this.images.length; imagesIndex++) {
//         // Generate the CSS for an individual image
//         newCSS += '.gallery.grid #image-gallery-image-' + imagesIndex + '{'
//           + 'width: ' + imageWidth + 'px; '
//           + 'position: absolute; '
//           + 'top: ' + cursorY + 'px;'
//           + 'left: ' + cursorX + 'px; ';
//
//         // Determine whether it should be a small or a large image
//         if (gridConfig.columns == 2 && gridConfig.imagesInGroup % 4 == 0) { // Mobile/Tablet
//           newCSS += 'height: ' + (imagesIndex % 4 == 0 || imagesIndex % 4 == 3 ? largeImageHeight : smallImageHeight) + 'px; ';
//         } else if (gridConfig.columns == 3 && gridConfig.imagesInGroup % 6 == 0) { // Desktop
//           newCSS += 'height: ' + (imagesIndex % 2 == 0 ? largeImageHeight : smallImageHeight) + 'px; ';
//         }
//
//         newCSS += '}';
//
//         // Now we need to move the cursor
//         // First, if the viewport mobile or tablet
//         if (this.images[imagesIndex + 1]) {
//           if (gridConfig.columns == 2 && gridConfig.imagesInGroup % 4 == 0) { // 2 columns, grouped by a multiple of 4
//             switch (imagesIndex % 4) {
//               case 0: // row 1, column 1, large
//                 cursorX += imageWidth + gridConfig.gutterSize;
//                 break;
//               case 2: // row 2, column 1, small
//                 cursorX += imageWidth + gridConfig.gutterSize;
//                 cursorY -= largeImageHeight - smallImageHeight;
//                 break;
//               case 1: // row 1, column 2, small
//               case 3: // row 2, column 2, large
//                 cursorX = 0;
//                 cursorY += largeImageHeight + gridConfig.gutterSize;
//                 break;
//               default:
//                 break;
//             }
//           // Otherwise, if the viewport is desktop
//           } else if (gridConfig.columns == 3 && gridConfig.imagesInGroup % 6 == 0) { // 2 columns, grouped by a multiple of 6
//             switch (imagesIndex % 6) {
//               case 0: // row 1, column 1, large
//               case 1: // row 1, column 2, small
//                 cursorX += imageWidth + gridConfig.gutterSize;
//                 break;
//               case 2: // row 1, column 3, large
//                 cursorX = 0;
//                 cursorY += largeImageHeight + gridConfig.gutterSize;
//                 break;
//               case 3: // row 2, column 1, small
//                 cursorX += imageWidth + gridConfig.gutterSize;
//                 cursorY -= largeImageHeight - smallImageHeight;
//                 break;
//               case 4: // row 2, column 2, large
//                 cursorX += imageWidth + gridConfig.gutterSize;
//                 cursorY += largeImageHeight - smallImageHeight;
//                 break;
//               case 5: // row 2, column 3, small
//                 cursorX = 0;
//                 cursorY += smallImageHeight + gridConfig.gutterSize;
//                 break;
//               default:
//                 break;
//             }
//           }
//         } else { // this is the last image, we don't want to increment cursorY unless it's the first img in a row
//           if (gridConfig.columns == 2 && gridConfig.imagesInGroup % 4 == 0) {
//             if (imagesIndex % 4 === 2) {
//               cursorY += smallImageHeight + gridConfig.gutterSize;
//             } else {
//               cursorY += largeImageHeight + gridConfig.gutterSize;
//             }
//           } else if (gridConfig.columns == 3 && gridConfig.imagesInGroup % 6 == 0) {
//             if (imagesIndex % 6 === 3 || imagesIndex % 6 === 5)
//               cursorY += smallImageHeight + gridConfig.gutterSize;
//             else {
//               cursorY += largeImageHeight + gridConfig.gutterSize;
//             }
//           }
//         }
//
//         // If we've inserted enough images that its time to put an ad there, do so!
//         if (imagesIndex %  gridConfig.imagesPerAd == gridConfig.imagesPerAd - 1) {
//           cursorY += gridConfig.adGutterSize - gridConfig.gutterSize;
//           newCSS += '.gallery.grid #image-gallery-mobile-grid-ad-' + Math.floor(imagesIndex /  gridConfig.imagesPerAd) + '{ position: absolute; top: ' + cursorY + 'px;}';
//           cursorY += gridConfig.adHeight + gridConfig.adGutterSize;
//         }
//       }
//
//       // Since all elements are absolutely positioned, we need to make sure the container is tall enough
//       newCSS += '.gallery.grid { position: relative; height: ' + cursorY + 'px;}';
//       return newCSS;
//     },
//     recalculateGrid: function () {
//       var galleryWidth = this.gallery.clientWidth,
//         breakpoint;
//
//       if (this.lastGalleryWidth === galleryWidth) {
//         return;
//       }
//
//       if ($window.innerWidth >= largeWidthBreakpoint) {
//         breakpoint = 'large';
//       } else if ($window.innerWidth >= mediumWidthBreakpoint) {
//         breakpoint = 'medium';
//       } else {
//         breakpoint = 'small';
//       }
//
//       if (!(galleryWidth in this.cachedGrids)) {
//         this.cachedGrids[galleryWidth] = this.generateGridCSS(galleryWidth, breakpoint);
//       }
//       this.gridStyles.innerHTML = this.cachedGrids[galleryWidth];
//       this.lastGalleryWidth = galleryWidth;
//     },
//     showModal: function () {
//       this.modal.classList.add('visible', 'trans-element');
//     },
//
//     openImageInModal: function (event) {
//       var targetImageGalleryImage = dom.closest(event.target, '.image-gallery-image'),
//         clonedImageGalleryImage,
//         picture,
//         img,
//         sources,
//         attribution;
//
//       this.targetImageGalleryImage = targetImageGalleryImage;
//
//       if (this.currentView != 'grid') {
//         return;
//       }
//
//       // using removeChild is more performant than setting innerHTML to be empty
//       // across all browsers https://jsperf.com/innerhtml-vs-removechild
//       while (this.modalBody.firstChild) {
//         this.modalBody.removeChild(this.modalBody.firstChild);
//       }
//       clonedImageGalleryImage = targetImageGalleryImage.cloneNode(true);
//       attribution = dom.find(clonedImageGalleryImage, '.attribution');
//
//       // expand the attribution
//       if (attribution) {
//         attribution.classList.remove('truncated');
//       }
//
//       // this short-circuits the lazy-loading behavior we use in image-gallery-image/client.js
//       picture = dom.find(clonedImageGalleryImage, '.list-img');
//       picture.classList.remove('fade-in-element');
//       picture.classList.remove('hidden');
//       img = dom.find(picture, 'img');
//       img.setAttribute('src', img.getAttribute('data-src'));
//       sources = dom.findAll(picture, 'source');
//       sources.forEach(function (source) {
//         source.setAttribute('srcset', source.getAttribute('data-srcset'));
//       });
//
//       // update current image in modal-counter
//       this.modalCounter.innerHTML = Array.prototype.indexOf.call(this.images, targetImageGalleryImage) + 1;
//       this.modalBody.appendChild(clonedImageGalleryImage);
//       this.modal.focus();
//       this.modalBody.scrollTop = 0;
//       this.pageYOffset = $window.pageYOffset;
//
//       if ($window.innerWidth >= 1180) {
//         this.noScroll.on();
//       }
//
//       img.addEventListener('load', this.showModal.bind(this));
//     },
//     closeModal: function () {
//       this.modal.classList.remove('trans-element');
//       this.noScroll.off();
//       $window.scroll(0, this.pageYOffset);
//     },
//     handleTransitionEnd: function (e) {
//       if (e.propertyName === 'opacity' && this.modal.classList.contains('visible') && !this.modal.classList.contains('trans-element')) {
//         this.modal.classList.remove('visible');
//       }
//     },
//     handleModalKeydown: function (e) {
//       const event = e || window.event;
//
//       // close modal with escape key press
//       if (event.keyCode === 27) {
//         this.closeModal();
//       }
//     }
//   };
//
//   return Constructor;
// }]);
