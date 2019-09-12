'use strict';

/*
  User permissions are functions off of the main user object that are chained into a sentence
    locals.user.can('publish').an('article').for('NATL-RC').value

  They can also be passed in all at once
    locals.user.may('publish', 'article', 'NATL-RC').value

  The order does not matter, they can we switched around to whatever works best for the situation
    locals.user.for('NATL-RC').using('gallery').isAbleTo('update')

  The main object is the only required item, it will default the other conditions
    locals.user.canUse('alert-banner').message

  The check will return an object with a boolean value and string message key:
    {
      value: false,
      message: 'You do not have permissions to publish an article.'
    }
    {
      value: true,
      message: ''
    }
*/

const pluralize = require('pluralize'),
  KEYS = {
    action: 'can,hasPermissionsTo,isAbleTo,may,will,to,include,allow'.split(','),
    target: 'a,an,the,this,using,canUse,canModify'.split(','),
    location: 'at,for,with,on'.split(',')
  },
  /**
   * setup the sentence permissions methods
   *
   * @return {Function}
   */
  userPermissions = () => {
    let _permissions = {}, // the permissions to check against
      _condition = {}, // action/target/location key/value
      _methods = {}, // all of the chained methods
      _override = false; // override all permission checks

    const _DEFAULT = {
        action: 'access',
        location: 'NATL-RC'
      },
      /**
       * make the string representing what the user does not have permissions to do
       *
       * @param {string} action
       * @param {string} target
       * @return {string}
       */
      createMessage = (action, target) => {
        const perform = action === _DEFAULT.action ? '' : ` ${action}`;

        return `You do not have permissions to${perform} ${pluralize(target.replace(/-/g, ' '))}.`;
      },
      /**
       * returns an the action, target, location given action, target, location
       *
       * @param {object|string} action
       * @param {string} target
       * @param {string} location
       *
       * @return {object}
       */
      getCondition = (action, target, location) => {
        const actionIsString = typeof action === 'string';

        // if an action is passed in as an object, the key becomes the action and the value becomes the target
        return {
          action: actionIsString ? action : Object.keys(action).pop(),
          target: actionIsString ? target : Object.values(action).pop(),
          location
        };
      },
      /**
       * checks the permission object for the currently defined condition (action/target/location) and
       * returns the value or message based on the type of variable requested.
       *
       * example permissions object = {
       *    article:{
       *      publish:{ station:{ 'NATL-RC': 1} },
       *    },
       *    gallery:{
       *      update:{ station:{ KILTAM: 1, KLOLFM: 1} },
       *    },
       *    'alert-banner':{
       *      access:{ station:{'NATL-RC': 1 } }
       *    }
       *  }
       *
       * @param {string} type - value/message
       * @return {boolean|string}
       */
      checkCondition = (type) => {
        let value = false,
          message = '';
        const { action = _DEFAULT.action, target, location = _DEFAULT.location } = _condition;

        if (target) {
          const {
            action: actionToCheck,
            target: targetToCheck,
            location: locationToCheck
          } = getCondition(action, target, location);

          value = Boolean(_override || (_permissions[targetToCheck] &&
            _permissions[targetToCheck][actionToCheck] &&
            _permissions[targetToCheck][actionToCheck].station[locationToCheck]));

          if (!value) {
            message = createMessage(actionToCheck, targetToCheck);
          }
        }

        return type === 'message' ? message : value ;
      },
      /**
       * updates the condition keys based on the type and arguments passed in.
       * Each condition type will pass the arguments in a different order.
       *
       * @param {string} type - action/target/location
       * @param {string} arg1
       * @param {string} arg2
       * @param {string} arg3
       */
      setCondition = (type, { arg1, arg2, arg3 }) => {
        /**
         * modifies the condition object with the value for the type if passed in
         *
         * @param {object} condition - { action, target, location }
         */
        const updateCondition = (condition) => {
          Object.keys(condition).forEach(item => _condition[item] = condition[item] || _condition[item]);
        };

        switch (type) {
          case 'action':
            updateCondition({ action: arg1, target: arg2, location: arg3 });
            break;
          case 'target':
            updateCondition({ target: arg1, action: arg2, location: arg3 });
            break;
          case 'location':
            updateCondition({ location: arg1, action: arg2, target: arg3 });
            break;
          default:
            throw new Error(`Invalid condition type ${type}.`);
        }
      },
      /**
       * setup the object with the chained action.target.location methods
       */
      createMethods = () => {
        /**
         * set value and message getters on the object
         *
         * @param {object} obj
         * @return {object}
         */
        const addGetters = (obj) => {
            obj.__defineGetter__('value', () => {
              return checkCondition('value');
            });
            obj.__defineGetter__('message', () => {
              return checkCondition('message');
            });

            return obj;
          },
          /**
           * setup the base arguments and return the chaining function
           *
           * @param {string} type
           * @param {boolean} reset
           * @return {function}
           */
          chainFunctions = (type, reset) => {
            /**
             * creates an object with all of the chained functions based on that values passed in
             *
             * @param {function} next
             * @param {function} then
             * @return {object}
             */
            return (next, then) => {
              const obj = {},
                /**
                 * a single instance of the function to run as each key named function
                 *
                 * @param {string} arg1
                 * @param {string} arg2
                 * @param {string} arg3
                 * @return {Object}
                 */
                func = (arg1, arg2, arg3) => {
                  if (reset) {
                    _condition = {};
                  }

                  setCondition(type, {arg1, arg2, arg3});

                  if (next) {
                    return addGetters(next(then));
                  }
                  return addGetters({});
                };

              KEYS[type].forEach(key => obj[key] = func);

              return obj;
            };
          },
          /**
           *  setup the base location chained functions
           *
           * @param {function} next
           * @param {function} then
           * @param {boolean} reset
           * @return {object}
           */
          locations = (next, then, reset) => {
            return chainFunctions('location', reset)(next, then);
          },
          /**
           *  setup the base object chained functions
           *
           * @param {function} next
           * @param {function} then
           * @param {boolean} reset
           * @return {object}
           */
          targets = (next, then, reset) => {
            return chainFunctions('target', reset)(next, then);
          },
          /**
           *  setup the base action chained functions
           *
           * @param {function} next
           * @param {function} then
           * @param {boolean} reset
           * @return {object}
           */
          actions = (next, then, reset) => {
            return chainFunctions('action', reset)(next, then);
          };

        _methods = {
          ...locations(actions, targets, true),
          ...targets(actions, locations, true),
          ...actions(targets, locations, true)
        };
      },
      /**
       * mutates a user object adding all of the chained permission functions to it
       *
       * @param {object} user
       */
      addMethods = (user) => {
        Object.keys(_methods).forEach(method => user[method] = _methods[method]);
      };

    // immediately create all methods as soon as this service has been created.
    createMethods();

    /**
     * mutate a user object with the chained permission functions storing the permissions internally
     *
     * @param {object} locals
     */
    return ({ user, permissions, station }) => {
      if (user && !user.can) {
        _permissions = permissions || {};
        _override = false;

        if (user.provider === 'google') {
          _permissions = { station: { access: { station: { 'NATL-RC': 1 } } } };
        }

        // helper to not have to pass station
        if (station && station.callsign) {
          _DEFAULT.location = station.callsign;
        }

        addMethods(user);
      }
    };
  };

module.exports = userPermissions();
