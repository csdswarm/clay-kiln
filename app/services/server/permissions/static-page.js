'use strict';

const
  { getComponentName } = require('clayutils'),
  { getMainComponentsForPageUri } = require('../db'),
  log = require('../../universal/log').setup({ file: __filename });

/**
 * Creates a filter method for _list menu items that will verify that the user has permissions
 * if it is a 'new-static-page' menu item
 * @param { Object } user - locals.user object
 * @returns { function(*): boolean }
 */
function canCreateMenuItem(user) {
  const hasPermission = user.can('create').a('static-page').value;

  /**
   * returns true if item is not a static page or if user has static page permissions
   * @param { Object } item - a menu item or child item
   * @returns { boolean }
   */
  return item => item.id !== 'new-static-page' || hasPermission;
}

/**
 * Checks a page uri (even if it is a custom url or slug) and indicates if it is a static page or
 * not
 * @param { string } uri
 * @returns { Promise<boolean> }
 */
async function isPageAStaticPage(uri) {
  try {
    const pageMainComponents = await getMainComponentsForPageUri(uri);

    return pageMainComponents.some(component => getComponentName(component) === 'static-page');
  } catch (error) {
    log('error', `There was an error checking if page is static for uri: ${ uri }`, error);
  }
  return null;
}

module.exports = {
  canCreateMenuItem,
  isPageAStaticPage
};
