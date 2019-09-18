'use strict';

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

module.exports = {
  canCreateMenuItem
};
