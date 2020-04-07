'use strict';

const
  _bindAll = require('lodash/bindAll'),
  componentName = 'newsletter-sign-up',
  formClass = `${componentName}__form`,
  formInputClass = `${componentName}__form-input`,
  formInputs = ['email', 'zip', 'birthday', 'submit'];

let $;

class NewsletterSignUpView {
  constructor(el) {
    this.elements = {
      container: el,
      form: {
        el: $(`.${formClass}`),
        inputs: formInputs.map(input => $(`.${formInputClass}--${input}`))
      }
    };
  }
  onInputChange(e) {
    this.toggleInputIsEmpty(e.target);
  }
  toggleInputIsEmpty(el) {
    console.log(el);
  }
}

class NewsletterSignUpCtrl {
  constructor(el) {
    _bindAll(this, ['onMount', 'onDismount', 'onInputChange']);
    this.view = new NewsletterSignUpView(el);
    this.listeners = [];
    this.addEventListener = this.getEventListener('add');
    this.removeEventListener = this.getEventListener('remove');
    console.log('[this]', this);
    this.addEventListener({
      el: document,
      type: `${componentName}-mount`,
      cb: this.onMount
    });
  }
  getEventListener(action) {
    return (listenerDef) => {
      this.listeners.push(listenerDef);
      listenerDef.el[`${action}EventListener`](listenerDef.type, listenerDef.cb);
    };
  }
  onMount() {
    console.log('lis', this.getEventListener('remove'));
    this.addListeners();
  }
  addListeners() {
    this.view.elements.form.inputs.forEach(el => {
      this.addEventListener({
        el,
        type: 'change',
        cb: this.onInputChange
      });
    });
  }
  onInputChange(e) {
    this.view.onInputChange(e);
  }
  onDismount() {
    document.removeEventListener(`${componentName}-mount`, this.onMount);
    document.removeEventListener(`${componentName}-dismount`, this.onDismount);
    this.listeners.forEach(listenerDef => {
      this.removeEventListener(listenerDef);
    });
  }
}

module.exports = (el) => {
  $ = el.querySelector.bind(el);
  return new NewsletterSignUpCtrl(el);
};
