'use strict';

const { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
  __ = {
    retrieveList
  },
  _isPlainObject = require('lodash/isPlainObject');

/**
 * Takes a text value and converts it to a navigable slug
 *
 * @param {string} value the value to convert to a slug
 * @returns {string} a new url-friendly slug
 */
function slugify(value) {
  // tech debt: remove any characters that shouldn't be in a url.  This is
  //   only necessary because we're transforming section front titles to
  //   section front urls which causes a problem in the case of
  //   "i'm listening".  Ideally we'd store the section front url and use
  //   it directly.

  const cleanValue = value
    .toLocaleLowerCase()
    .trim()
    .replace(/&/g, ' ')
    .replace(/\//g, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, '-');

  return encodeURIComponent(cleanValue);
}

/**
 * Takes an array of objects and concatenates the `prop` value of each object with the `separator` provided
 *
 * @param {Object[]} arr an array of objects. NOTE: must include a property with name that matches `prop`.
 * @param {string} prop the name of the property of each object of the array to concatenate
 * @param {string|'/'} separator the separator to use
 * @returns {string} All prop values of the object array concatenated with the separator into a single string
 * @example
 * // returns 1,3,4
 * concatValues([{a:1, b:2}, {a:3}, {a:4, c:5}], 'a', ',')
 */
function concatValues(arr, prop, separator = '/') {
  return arr.map(item => item[prop]).join(separator);
}

/**
 * Returns the display names for applicable props.
 *
 * @param {Object} data
 * @param {Object} lists
 * @returns {function(*): {id: *, text: *, slug: *}}
 */
function useDisplayName(data, lists) {
  const useSectionFrontName = prop => {
    const id = data[prop];
    let text = id;

    const list = lists[prop];

    if (list) {
      text = getSectionFrontName(id, list);
    }

    return { id, text };
  };

  return prop => {
    // if prop is an object then it should contain the data breadcrumbs needs
    if (_isPlainObject(prop)) {
      return prop;
    } else {
      // otherwise it will be a string indicating the section front type
      return useSectionFrontName(prop);
    }
  };
}

/**
 * Returns a function intended to use with an Array.prototype.map method to convert a value of a data object specified
 * by `prop` into an object containing {text, segment}
 *
 * @returns {function(string): {segment: string, text: string}}
 * @example
 * // returns a function that takes a property name as its only argument
 * const toSegments = toLinkSegments({p1:'stuff', myProp:'One & Two/Thirds'});
 * // returns {segment: 'one-%26-two%2Fthirds', text: 'One & Two/Thirds'}
 * toSegments('myProp')
 */
function toLinkSegments() {
  return ({ id, text, slug }) => ({
    segment: slug || slugify(id),
    text
  });
};

/**
 * Creates a single crumb object
 *
 * @param {string} url
 * @param {string} text
 * @param {boolean} hidden
 * @return {object}
 */
function createCrumb(url, text, hidden = false) {
  return { url, text, hidden };
}

/**
 * Returns a function intended to use with an Array.prototype.map method that converts a list of {text, segment}
 * objects into {text, url} objects
 *
 * @param {Object} locals - used to get the hostname to prepend to the resulting link
 * @returns {function({text: string}, number, Object[]): {text: string, url: string}} A function that creates a link
 * @example
 * // returns a function to use for mapping an array
 * const makeFullLink = toFullLinks('clay.radio.com');
 * const arr = [{segment: 'first', text: 'First'},{segment: 'second', text: 'Second'}];
 * // returns {url: '//clay.radio.com/first/second', text: 'Second'}
 * makeFullLink(arr[1], 1, arr);
 */
function toFullLinks(locals) {
  return ({ text }, index, segments) => createCrumb(`//${locals.site.host}/${concatValues(segments.slice(0, index + 1), 'segment')}`, text);
}

/**
 * Retrieve all of the lists needed, as specified by props.
 *
 * @param {string[]} props
 * @param {Object} locals
 * @returns {Promise<Object>}
 */
async function retrieveSectionFrontLists(props, locals) {
  const lists = {
    sectionFront: 'primary-section-fronts',
    secondarySectionFront: 'secondary-section-fronts'
  };

  await Promise.all(Object.keys(lists).map(listProp => {
    if (props.includes(listProp)) {
      return __.retrieveList(lists[listProp], { locals })
        .then(list => lists[listProp] = list);
    }
  }));

  return lists;
}

module.exports = {
  _internals: __,
  /**
   * Automatically creates links based on data in the provided list of
   * properties on the data context
   * or based on object provided
   *
   * @param {Object} data the data context
   * @param {any[]} props list of properties on data or object to generate links from:
   * @param {string} props[].slug
   * @param {string} props[].text display name
   * @param {Object} locals
   */
  async autoLink(data, props, locals) {
    const existingProp = (prop, dataObj) => dataObj[prop] || prop.text && prop.slug,
      lists = await retrieveSectionFrontLists(props, locals);
    let breadcrumbItems = props
        .filter(prop => existingProp(prop, data))
        .map(useDisplayName(data, lists)),
      breadcrumbProps = props;

    if (locals.station.site_slug && locals.station.name) {
      breadcrumbProps = [
        { slug: locals.station.site_slug, text: locals.station.name },
        ...props
      ];
      breadcrumbItems = breadcrumbProps
        .filter(prop => existingProp(prop, data))
        .map(useDisplayName(data, lists));
    }

    if (locals.station.site_slug && data.stationSyndication) {
      const syndication = data.stationSyndication.find(
        station => station.callsign === locals.station.callsign
      );

      // ON-2026: SectionFront must be taken into account since is been used to complete the breadcrumbs
      // when a content is imported only the callsign is been set in the process.
      if (syndication && syndication.sectionFront) {
        breadcrumbProps = [
          { slug: syndication.stationSlug, text: syndication.stationName },
          ...props
        ];
        breadcrumbItems = breadcrumbProps
          .filter(prop => existingProp(prop, syndication))
          .map(useDisplayName(syndication, lists));
      } else if (data.stationSlug !== locals.station.site_slug) {
        breadcrumbItems.pop();
      }
    }

    data.breadcrumbs = breadcrumbItems
      .map(toLinkSegments())
      .map(toFullLinks(locals));

    // add hidden headline crumb for articles and galleries
    if (data.headline && data.canonicalUrl) {
      const url = data.canonicalUrl.replace('https:', '').replace('http:', '');

      data.breadcrumbs.push(createCrumb(url, data.headline, true));
    }
  },

  /**
   * Adds a breadcrumbs to the data object
   *
   * @param {Object} data the data context
   * @param {string} url
   * @param {string} text
   */
  addCrumb(data, url, text) {
    if (!data.breadcrumbs) {
      data.breadcrumbs = [];
    }

    data.breadcrumbs.push(createCrumb(url, text));
  }
};
