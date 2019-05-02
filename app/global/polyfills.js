/* eslint-disable */
'use strict';
(function () {
  // window.CustomEvent -- https://gist.github.com/gt3/787767e8cbf0451716a189cdcb2a0d08
  if (typeof window.CustomEvent === 'function') return false;
  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent'); // eslint-disable-line vars-on-top

    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = window.Event = CustomEvent;

  // Array.forEach -- https://gist.github.com/githiro/5819142
  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, scope) {
      for (var i = 0, len = this.length; i < len; ++i) {  // eslint-disable-line vars-on-top
        fn.call(scope, this[i], i, this);
      }
    };
  }
  if (typeof NodeList.prototype.forEach === 'function')
    return false;
  else
    NodeList.prototype.forEach = Array.prototype.forEach;

  // ParentNode.prepend() -- https://github.com/fleck/parent-node-prepend-polyfill
  (function (arr) {
    arr.forEach(function (item) {
      if (item.hasOwnProperty('prepend')) {
        return;
      }
      Object.defineProperty(item, 'prepend', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function prepend() {
          var argArr = Array.prototype.slice.call(arguments),
            docFrag = document.createDocumentFragment();

          argArr.forEach(function (argItem) {
            var isNode = argItem instanceof Node;

            docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
          });

          this.insertBefore(docFrag, this.firstChild);
        }
      });
    });
  }([Element.prototype, Document.prototype, DocumentFragment.prototype]));

  // querySelectorAll
  if (!document.querySelectorAll) {
    document.querySelectorAll = function (selectors) {
      var style = document.createElement('style'), elements = [], element;

      document.documentElement.firstChild.appendChild(style);
      document._qsa = [];

      style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
      window.scrollBy(0, 0);
      style.parentNode.removeChild(style);

      while (document._qsa.length) {
        element = document._qsa.shift();
        element.style.removeAttribute('x-qsa');
        elements.push(element);
      }
      document._qsa = null;
      return elements;
    };
  }

  if (!document.querySelector) {
    document.querySelector = function (selectors) {
      var elements = document.querySelectorAll(selectors);

      return elements.length ? elements[0] : null;
    };
  }

  // includes
  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }
  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
      enumerable: false,
      value: function (obj) {
        var newArr = this.filter(function (el) {
          return el == obj;
        });

        return newArr.length > 0;
      }
    });
  }

  // ChildNode.after() -- https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/after()/after().md
  (function (arr) {
    arr.forEach(function (item) {
      if (item.hasOwnProperty('after')) {
        return;
      }
      Object.defineProperty(item, 'after', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function after() {
          var argArr = Array.prototype.slice.call(arguments),
            docFrag = document.createDocumentFragment();

          argArr.forEach(function (argItem) {
            var isNode = argItem instanceof Node;

            docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
          });

          this.parentNode.insertBefore(docFrag, this.nextSibling);
        }
      });
    });
  }([Element.prototype, CharacterData.prototype, DocumentType.prototype]));

  // Closest - https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
  if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest =
      function (s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
          i,
          el = this;

        do {
          i = matches.length;
          while (--i >= 0 && matches.item(i) !== el) {};
        } while ((i < 0) && (el = el.parentElement));
        return el;
      };
  }

  // ParentNode.append - https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/append#Polyfill
  // Source: https://github.com/jserz/js_piece/blob/master/DOM/ParentNode/append()/append().md
  (function (arr) {
    arr.forEach(function (item) {
      if (item.hasOwnProperty('append')) {
        return;
      }
      Object.defineProperty(item, 'append', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function append() {
          var argArr = Array.prototype.slice.call(arguments),
            docFrag = document.createDocumentFragment();

          argArr.forEach(function (argItem) {
            var isNode = argItem instanceof Node;
            docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
          });

          this.appendChild(docFrag);
        }
      });
    });
  })([Element.prototype, Document.prototype, DocumentFragment.prototype]);

  // Object.prototype.assign -
  //   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
  if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
      value: function assign(target, varArgs) { // .length of function is 2
        'use strict';
        if (target == null) { // TypeError if undefined or null
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];

          if (nextSource != null) { // Skip over if undefined or null
            for (var nextKey in nextSource) {
              // Avoid bugs when hasOwnProperty is shadowed
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable: true,
      configurable: true
    });
  }

  // Object.classList methods
  //    https://gist.github.com/k-gun/c2ea7c49edf7b757fe9561ba37cb19ca
  (function() {
    // Helpers.
    var trim = function(s) {
        return s.replace(/^\s+|\s+$/g, '');
      },
      regExp = function(name) {
        return new RegExp('(^|\\s+)'+ name +'(\\s+|$)');
      },
      forEach = function(list, fn, scope) {
        for (var i = 0; i < list.length; i++) {
          fn.call(scope, list[i]);
        }
      };

    // Class list object with basic methods.
    function ClassList(element) {
      this.element = element;
    }

    ClassList.prototype = {
      add: function() {
        forEach(arguments, function(name) {
          if (!this.contains(name)) {
            this.element.className = trim(this.element.className +' '+ name);
          }
        }, this);
      },
      remove: function() {
        forEach(arguments, function(name) {
          this.element.className = trim(this.element.className.replace(regExp(name), ' '));
        }, this);
      },
      toggle: function(name) {
        return this.contains(name) ? (this.remove(name), false) : (this.add(name), true);
      },
      contains: function(name) {
        return regExp(name).test(this.element.className);
      },
      item: function(i) {
        return this.element.className.split(/\s+/)[i] || null;
      },
      // bonus
      replace: function(oldName, newName) {
        this.remove(oldName), this.add(newName);
      }
    };

    // IE8/9, Safari
    // Remove this if statements to override native classList.
    if (!('classList' in Element.prototype)) {
      // Use this if statement to override native classList that does not have for example replace() method.
      // See browser compatibility: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList#Browser_compatibility.
      // if (!('classList' in Element.prototype) ||
      //     !('classList' in Element.prototype && Element.prototype.classList.replace)) {
      Object.defineProperty(Element.prototype, 'classList', {
        get: function() {
          return new ClassList(this);
        }
      });
    }

    // For others replace() support.
    if (window.DOMTokenList && !DOMTokenList.prototype.replace) {
      DOMTokenList.prototype.replace = ClassList.prototype.replace;
    }
  })();
}());
