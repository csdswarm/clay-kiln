'use strict';

// URL patterns below need to be handled by the site's index.js
module.exports.dateUrlPattern = o => `${o.prefix}/${o.sectionFront}/${o.slug}.html`; // e.g. http://vulture.com/music/x.html - modified re: ON-333
module.exports.articleSlugPattern = o => `${o.prefix}/${o.sectionFront}/${o.slug}`; // e.g. http://radio.com/music/eminem-drops-new-album-and-its-fire - modified re: ON-333
module.exports.articleSecondarySectionFrontSlugPattern = o => `${o.prefix}/${o.sectionFront}/${o.secondarySectionFront}/${o.slug}`;
module.exports.gallerySlugPattern = o => `${o.prefix}/${o.sectionFront}/gallery/${o.slug}`; // e.g. http://radio.com/music/gallery/grammies
module.exports.gallerySecondarySectionFrontSlugPattern = o => `${o.prefix}/${o.sectionFront}/${o.secondarySectionFront}/gallery/${o.slug}`;
module.exports.sectionFrontSlugPattern = o => `${o.prefix}/${o.sectionFront}`; // e.g. http://radio.com/music
module.exports.secondarySectionFrontSlugPattern = o => `${o.prefix}/${o.primarySectionFront}/${o.sectionFront}`; // e.g. http://radio.com/music/pop
module.exports.podcastFrontSlugPattern = o => `${o.prefix}/podcasts`; // e.g. http://radio.com/podcasts
