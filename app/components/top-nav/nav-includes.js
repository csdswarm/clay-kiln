'use strict';

const COOKIE_NAME = 'api_stg';

/** Class for working with a browser cookie. */
class Cookie {
  constructor() {}
  /**
   * static method used to get the value of the provide key(name) of cookie
   *
   * @param {string} name - cookie key
   * @return {string} cookies value
   */
  static getCookie(name) {
    const value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');

    return value ? value[2] : null;
  }
  /**
   * static method used to set the value of the provide key(name) of cookie
   *
   * @param {string} name - cookie key
   * @param {string} value - cookie value
   * @param {num} days - cookie days to expire
   */
  static setCookie(name, value, days) {
    const date = new Date;

    date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * days);
    document.cookie = name + '=' + value + ';path=/;expires=' + date.toGMTString();
  }
  /**
   * static method used to remove the value of the provide key(name) of cookie
   *
   * @param {string} name - cookie key to delete
   */
  static deleteCookie(name) {
    this.setCookie(name, '', -1);
  }
}

/** Class for working with dom in the context of staging helper */
class StagingHelperUI {
  /**
   * method initialize and build the ui
   */
  constructor() {
    this.onClickRemove = this.onClickRemove.bind(this);
    this.createAndInsertStylesAndHtml();
    this.initDom();
    this.addListeners();
    setTimeout(() => {
      this.dom.el.classList.add('staging-helper__container--on');
    }, 0);
  }
  /**
   * method for adding html inside the nav component's element
   */
  createAndInsertStylesAndHtml() {
    document.body.querySelector('.component--top-nav').insertAdjacentHTML('afterbegin', this.getHtml());
  }
  /**
   * method for initializing the class's dom object which creates references to the ui elements
   */
  initDom() {
    this.dom = {
      el: document.querySelector('.staging-helper__container'),
      btn: document.querySelector('.staging-helper__clear-button')
    };
  }
  /**
   * method for adding listeners to referenced ui elements
   */
  addListeners() {
    this.dom.btn.addEventListener('click', this.onClickRemove);
  }
  /**
   * method for responding to the off button in ui
   */
  onClickRemove() {
    Cookie.deleteCookie(COOKIE_NAME);
    // change to remove the params from url to avoid a infinite loop
    const locationNoParams = window.location.protocol + '//' + window.location.host + window.location.pathname;

    window.location.replace(locationNoParams);
  }
  /**
   * method for returning the html for the ui
   *
   * @return {string} dom html
   */
  getHtml() {
    return `
      <div class="staging-helper__container">
        ${this.getStyles()} 
        <div class="staging-helper__text">StagingAPI Active</div>
        <button class="staging-helper__clear-button">off</button>
      </div>
    `;
  }
  /**
   * method for returning the styles for the ui
   *
   * @return {string} dom styles
   */
  getStyles() {
    return `
      <style>
        .staging-helper__container {
          position: fixed;
          top: -500px;
          right: 0px;
          width: fit-content;
          background: red;
          z-index: 100000;
          display: flex;
          align-items: center;
          padding: 1em;
          box-sizing: border-box;
          color: white;
          border-radius: 0.5em;
          margin: 1em;
          box-shadow: 2px 4px 6px 0 rgba(51, 51, 51, 0.4);
          transition: top 300ms ease-out 1500ms;
        }
        .staging-helper__container--on {
          top: 0;
        }
        .staging-helper__container .staging-helper__clear-button {
          border-radius: 0.5em;
          background: #ffda00;
          padding: 0.5em 1em;
          margin: 0 1em;
          font-weight: bold;
          color: #9c0003;
          line-height: 2em;
          text-transform: uppercase;
          transition: transform 125ms ease;
        }
        .staging-helper__container .staging-helper__clear-button:hover {
          color: #333;
          background: white;
          transform: scale(1.1);
        }
      </style>
    `;
  }
  /**
   * method for when dismount callback is invoked and listeners are removed properly
   */
  onDismount() {
    this.dom.btn.removeEventListener('click', this.onClickRemove);
  }
}

/** Class for staging helper */
class StagingHelper {
  constructor() { }
  /**
   * method for when the mount callback is invoked and we look for the cookie
   */
  onMount() {
    // look for cookie
    const api_stg = Cookie.getCookie(COOKIE_NAME);

    if (api_stg) {
      this.ui = new StagingHelperUI();
    }
  }
  /**
   * method for when the dismount callback is invoked
   */
  onDismount() {
    this.ui.onDismount();
  }
}

module.exports = {
  stagingHelper: new StagingHelper()
};
