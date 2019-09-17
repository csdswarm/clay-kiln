'use strict';

const COOKIE_NAME = 'api_stg';

class Cookie {
  constructor() {}

  static getCookie(name) {
    const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');

    return v ? v[2] : null;
  }

  static setCookie(name, value, days) {
    const date = new Date;

    date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * days);
    document.cookie = name + '=' + value + ';path=/;expires=' + date.toGMTString();
  }

  static deleteCookie(name) {
    this.setCookie(name, '', -1);
  }
}

class StagingHelperUI {
  constructor() {
    this.onClickRemove = this.onClickRemove.bind(this);
  }

  init() {
    this.createAndInsertStylesAndHtml();
    this.initDom();
    this.addListeners();
    setTimeout(()=>{
      this.dom.el.classList.add('staging-helper__container--on');
    },0);
  }

  createAndInsertStylesAndHtml() {
    document.body.querySelector('.component--top-nav').insertAdjacentHTML('afterbegin', `${this.getHtml()}` );
  }

  initDom() {
    this.dom = {
      el: document.querySelector('.staging-helper__container'),
      btn: document.querySelector('.staging-helper__clear-button')
    };
  }

  addListeners() {
    this.dom.btn.addEventListener('click', this.onClickRemove);
  }

  onClickRemove() {
    Cookie.deleteCookie(COOKIE_NAME);
    window.location.reload();
  }

  getHtml() {
    return `
      <div class="staging-helper__container">
        ${this.getStyles()} 
        <div class="staging-helper__text">StagingAPI Active</div>
        <button class="staging-helper__clear-button">off</button>
      </div>
    `;
  }

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

  onDismount() {
    this.dom.btn.removeEventListener('click', this.onClickRemove);
  }
}

class StagingHelper {
  constructor() {}

  onMount() {
    // look for cookie
    const api_stg = Cookie.getCookie(COOKIE_NAME);

    if (api_stg) {
      this.ui = new StagingHelperUI();
      this.ui.init();
    }
  }

  onDismount() {
    this.ui.onDismount();
  }
}

module.exports = {
  stagingHelper: new StagingHelper()
};
