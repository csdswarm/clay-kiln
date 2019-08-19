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


const KEYS = {
    action: 'can,hasPermissionsTo,isAbleTo,may,will,to,include,allow'.split(','),
    object: 'a,an,the,this,using,canUse,canModify'.split(','),
    location: 'at,for,with,on'.split(',')
  },
  DEFAULT = {
    action: 'any',
    location: 'NATL-RC'
  },
  /**
   * setup the sentence permissions methods
   *
   * @return {Function}
   */
  permissions = () => {
    let _permissions = {}, // the permissions to check against
      _condition = {}, // action/object/location key/value
      _methods = {}; // all of the chained methods

    /**
     * make the string representing what the user does not have permissions to do
     *
     * @param {string} action
     * @param {string} object
     * @return {string}
     */
    const createMessage = ({ action, object }) => {
        const a = ['a','e','i','o','u'].includes(object.charAt(0)) ? 'an' : 'a',
          perform = action === 'any' ? 'the' : `${action} ${a}`;

        return `You do not have permissions to ${perform} ${object.replace(/-/g, ' ')}.`;
      },
      /**
       * checks the permission object for the currently defined condition (action/object/location) and
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
       *      any:{ station:{'NATL-RC': 1 } }
       *    }
       *  }
       *
       * @param {string} type - value/message
       * @return {boolean|string}
       */
      checkCondition = (type) => {
        let value = false,
          message = '';
        const { action = DEFAULT.action, object, location = DEFAULT.location } = _condition;

        if (object) {
          value = Boolean(_permissions[object] &&
            _permissions[object][action] &&
            _permissions[object][action].station[location]);

          if (!value) {
            message = createMessage(_condition);
          }
        }

        return type === 'message' ? message : value ;
      },
      /**
       * updates the condition keys based on the type and arguments passed in.
       * Each condition type will pass the arguments in a different order.
       *
       * @param {string} type - action/object/location
       * @param {string} arg1
       * @param {string} arg2
       * @param {string} arg3
       */
      setCondition = (type, { arg1, arg2, arg3 }) => {
        /**
         * modifies the condition object with the value for the type if passed in
         *
         * @param {object} condition - { action, object, location }
         */
        const updateCondition = (condition) => {
          Object.keys(condition).forEach(item => _condition[item] = condition[item] || _condition[item]);
        };

        switch (type) {
          case 'action':
            updateCondition({ action: arg1, object: arg2, location: arg3 });
            break;
          case 'object':
            updateCondition({ object: arg1, action: arg2, location: arg3 });
            break;
          case 'location':
            updateCondition({ location: arg1, action: arg2, object: arg3 });
            break;
          default:
            throw new Error(`Invalid condition type ${type}.`);
        }
      },
      /**
       * setup the object with the chained action.object.location methods
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
          objects = (next, then, reset) => {
            return chainFunctions('object', reset)(next, then);
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
          ...locations(actions, objects, true),
          ...objects(actions, locations, true),
          ...actions(objects, locations, true)
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
     * @param {object} user
     * @param {object} permissions
     */
    return (user, permissions) => {
      _permissions = permissions;

      addMethods(user);
    };
  };


module.exports = permissions();
