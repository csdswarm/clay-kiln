'use strict';

const
  _bindAll = require('lodash/bindAll'),
  componentName = 'newsletter-sign-up',
  formClass = `${componentName}__form`,
  formInputClass = `${componentName}__form-input`,
  formInputLabelClass = `${componentName}__form-input-label`,
  formInputMsgClass = `${componentName}__form-input-msg`,
  formInputs = ['email', 'zip', 'birthday'];

let $;

const validations = {
  email: [
    (email) => {
      return {
        isValid: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email),
        invalidMsg: 'Please enter a valid email address'
      };
    }
  ],
  zip: [
    (zip) => {
      return {
        isValid: /^\d{5}$|^\d{5}-\d{4}$/.test(zip),
        invalidMsg: 'Please enter a valid postal code like 19020'
      };
    }
  ],
  birthday: [
    (birthday) => {
      return {
        isValid: /^[0-9]{2}[\/]{1}[0-9]{2}[\/]{1}[0-9]{4}$/.test(birthday),
        invalidMsg: 'Please enter a valid date like 09/08/2001'
      };
    },
    (birthday) => {
      const difference = Date.now() - new Date(birthday).getTime();

      return {
        isValid: Math.abs(new Date(difference).getUTCFullYear() - 1970) >= 13,
        invalidMsg: 'Must be 13 years or older to signup'
      };
    }]
};

class NewsletterSignUpModel {
  constructor() {
    this.form = {
      isValid: () => {
        return Object.entries(this.form.inputs)
          .every((curr) => {
            return curr[1].isValid === true;
          });
      },
      inputs: formInputs.reduce((prev, curr) => {
        prev[curr] = {
          isValid: false,
          validations: validations[curr]
        };
        return prev;
      }, {})
    };
  }
  getValidationResults(name, value) {
    const
      modelValidations = this.form.inputs[name].validations,
      validationResults = [];

    modelValidations.forEach(validation => {
      const result = validation(value);

      validationResults.push(result);
    });
    return validationResults;
  }
  validateInputFromResults(name, validationResults) {
    return this.form.inputs[name].isValid = validationResults
      .every(result => result.isValid);
  }
}

class NewsletterSignUpView {
  constructor(el) {
    this.elements = {
      container: el,
      form: {
        el: $(`.${formClass}`),
        inputs: formInputs.map(input => $(`.${formInputClass}--${input}`)),
        submit: $(`.${formInputClass}--submit`)
      }
    };
  }
  checkForEmptyInput(el) {
    if (!el.value.trim()) {
      console.log('empty');
      el.parentNode.classList.add(`${formInputLabelClass}--empty`);
    } else {
      el.parentNode.classList.remove(`${formInputLabelClass}--empty`);
    }
  }
  addInvalidMessages(el, inputIsValid, validationResults = []) {
    const
      msgEl = el.parentNode.querySelector(`.${formInputMsgClass}`);
    let msgHtml = '';

    msgEl.dataset.valid = inputIsValid;
    if (inputIsValid) return;

    validationResults.forEach( result => {
      if (!result.isValid) {
        msgHtml += `<div>${result.invalidMsg}</div>`;
      }
    });
    msgEl.innerHTML = msgHtml;
  }
  setSubmitState(isFormValid) {
    this.elements.form.submit.dataset.valid = isFormValid;
  }
}

class NewsletterSignUpCtrl {
  constructor(el) {
    _bindAll(this, ['onMount', 'onDismount', 'onInputChange', 'onSubmit']);
    this.view = new NewsletterSignUpView(el);
    this.model = new NewsletterSignUpModel();
    this.listeners = [];
    this.addEventListener({
      el: document,
      type: `${componentName}-mount`,
      cb: this.onMount
    });
  }
  addEventListener(listenerDef) {
    this.listeners.push(listenerDef);
    listenerDef.el.addEventListener(listenerDef.type, listenerDef.cb);
  }
  removeEventListener(listenerDef) {
    listenerDef.el.removeEventListener(listenerDef.type, listenerDef.cb);
  }
  onMount() {
    console.log('mounting', this);
    this.addListeners();
  }
  addListeners() {
    const viewElements = this.view.elements;

    viewElements.form.inputs.forEach(el => {
      this.addEventListener({
        el,
        type: 'change',
        cb: this.onInputChange
      });
    });
    this.addEventListener({
      el: viewElements.form.el,
      type: 'submit',
      cb: this.onSubmit
    });
  }
  onSubmit(e) {
    e.preventDefault();
    this.view.elements.container.classList.toggle(`${componentName}--success`);
  }
  onInputChange(e) {
    const
      inputEl = e.target,
      validationResults = this.model.getValidationResults(inputEl.name, inputEl.value),
      inputIsValid = this.model.validateInputFromResults(inputEl.name, validationResults);

    if (!validationResults) {
      return;
    }
    // console.log('[validationResults]', validationResults);
    // console.log('[form valid]', this.model.form.isValid());
    console.table(this.model.form.inputs);
    this.view.addInvalidMessages(e.target, inputIsValid, validationResults);
    this.view.checkForEmptyInput(inputEl);
    this.view.setSubmitState(this.model.form.isValid());
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
