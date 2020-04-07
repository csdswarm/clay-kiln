'use strict';

const
  _bindAll = require('lodash/bindAll'),
  componentName = 'newsletter-sign-up',
  formClass = `${componentName}__form`,
  formInputClass = `${componentName}__form-input`,
  formInputLabelClass = `${componentName}__form-input-label`,
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
    this.checkForEmptyInput(e.target);
  }
  checkForEmptyInput(el) {
    if (!el.value.trim()) {
      console.log('empty');
      el.parentNode.classList.add(`${formInputLabelClass}--empty`);
    } else {
      el.parentNode.classList.remove(`${formInputLabelClass}--empty`);
    }
  }
}

class NewsletterSignUpCtrl {
  constructor(el) {
    _bindAll(this, ['onMount', 'onDismount', 'onInputChange']);
    this.view = new NewsletterSignUpView(el);
    this.listeners = [];
    this.addEventListener = this.getEventListenerMethod('add');
    this.removeEventListener = this.getEventListenerMethod('remove');
    this.addEventListener({
      el: document,
      type: `${componentName}-mount`,
      cb: this.onMount
    });
  }
  getEventListenerMethod(action) {
    return (listenerDef) => {
      if (action === 'add') this.listeners.push(listenerDef);
      listenerDef.el[`${action}EventListener`](listenerDef.type, listenerDef.cb);
    };
  }
  onMount() {
    console.log('mounting', this);
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
