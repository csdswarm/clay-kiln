'use strict';

const
  _bindAll = require('lodash/bindAll'),
  qs = require('qs'),
  rest = require('../../services/universal/rest'),
  componentName = 'newsletter-sign-up',
  formClass = `${componentName}__form`,
  formInputClass = `${componentName}__form-input`,
  formInputLabelClass = `${componentName}__form-input-label`,
  formInputMsgClass = `${componentName}__form-input-msg`,
  formInputs = ['email', 'zip', 'birthday'];

let $;

/**
 * validation rules keyed to form inputs
 */
const validations = {
  email: [
    (email) => {
      return {
        // email regex
        isValid: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email),
        invalidMsg: 'Please enter a valid email address'
      };
    }
  ],
  zip: [
    (zip) => {
      return {
        // zip regex
        isValid: /^\d{5}$|^\d{5}-\d{4}$/.test(zip),
        invalidMsg: 'Please enter a valid postal code like 19020'
      };
    }
  ],
  birthday: [
    (birthday) => {
      return {
        // birthday regex
        isValid: /^[0-9]{2}[\/]{1}[0-9]{2}[\/]{1}[0-9]{4}$/.test(birthday),
        invalidMsg: 'Please enter a valid date like 09/08/2001'
      };
    },
    (birthday) => {
      // birthday ase >= 13
      const difference = Date.now() - new Date(birthday).getTime();

      return {
        isValid: Math.abs(new Date(difference).getUTCFullYear() - 1970) >= 13,
        invalidMsg: 'Must be 13 years or older to signup'
      };
    }]
};

/**
 *
 * Component model class
 * @class NewsletterSignUpModel
 */
class NewsletterSignUpModel {
  /**
   *Creates an instance of NewsletterSignUpModel.
   * @memberof NewsletterSignUpModel
   */
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
  /**
   *
   * Goes through the keyed validations and runs each validation
   * @param {string} name
   * @param {number} value
   * @returns {object} validationResults
   * @memberof NewsletterSignUpModel
   */
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
  /**
   *
   * Evaluate and determines valid (true|false) by examining the results
   * @param {string} name
   * @param {object} validationResults
   * @returns {boolean}
   * @memberof NewsletterSignUpModel
   */
  validateInputFromResults(name, validationResults) {
    return this.form.inputs[name].isValid = validationResults
      .every(result => result.isValid);
  }
}

/**
 *
 * Component view class
 * @class NewsletterSignUpView
 */
class NewsletterSignUpView {
  /**
   *Creates an instance of NewsletterSignUpView.
   * @param {HTMLElement} el
   * @memberof NewsletterSignUpView
   */
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
  /**
   *
   * checks for empty input and sets a class accordingly
   * @param {HTMLElement} el
   * @memberof NewsletterSignUpView
   */
  checkForEmptyInputAndSetClass(el) {
    if (!el.value.trim()) {
      el.parentNode.classList.add(`${formInputLabelClass}--empty`);
    } else {
      el.parentNode.classList.remove(`${formInputLabelClass}--empty`);
    }
  }
  /**
   *
   * goes through and adds the corresponding message if the validation is false
   * @param {HTMLInputElement} el
   * @param {boolean} inputIsValid
   * @param {array} [validationResults=[]]
   * @memberof NewsletterSignUpView
   */
  addInvalidMessages(el, inputIsValid, validationResults = []) {
    const
      msgEl = el.parentNode.querySelector(`.${formInputMsgClass}`);
    let msgHtml = '';

    el.dataset.valid = inputIsValid;
    msgEl.dataset.valid = inputIsValid;
    if (inputIsValid) return;

    validationResults.forEach( result => {
      if (!result.isValid) {
        msgHtml += `<div>${result.invalidMsg}</div>`;
      }
    });
    msgEl.innerHTML = msgHtml;
  }
  /**
   *
   * sets the sate of the submit button according to wether the form is valid
   * @param {boolean} isFormValid
   * @memberof NewsletterSignUpView
   */
  setSubmitState(isFormValid) {
    this.elements.form.submit.dataset.valid = isFormValid;
  }
}

/**
 *
 * Component controller class
 * @class NewsletterSignUpCtrl
 */
class NewsletterSignUpCtrl {
  /**
   *Creates an instance of NewsletterSignUpCtrl.
   * @param {HTMLElement} el
   * @memberof NewsletterSignUpCtrl
   */
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
    this.apiEndpoint = '//' + el.getAttribute('data-uri').replace('@published', '');
  }
  /**
   *
   * Add listener with config object
   * @param {object} listenerConfig
   * @memberof NewsletterSignUpCtrl
   */
  addEventListener(listenerConfig) {
    this.listeners.push(listenerConfig);
    listenerConfig.el.addEventListener(listenerConfig.type, listenerConfig.cb);
  }
  /**
   *
   * Remove listener with config object
   * @param {object} listenerConfig
   * @memberof NewsletterSignUpCtrl
   */
  removeEventListener(listenerConfig) {
    listenerConfig.el.removeEventListener(listenerConfig.type, listenerConfig.cb);
  }
  /**
   *
   * SPA mount event handler
   * @memberof NewsletterSignUpCtrl
   */
  onMount() {
    this.addListeners();
  }
  /**
   *
   * add all the listeners
   * @memberof NewsletterSignUpCtrl
   */
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
  /**
   *
   * when the user submits the form
   * right now the PostUp endpoint can be called with a fetch however, only with 'no-cors'
   * which, prevents parsing of the response - my solution is a proxy on the model
   * that make the request and parses the returned html to determine the state
   * of the response and forwards along a nice json object - right now the design
   * only supports errors on the inputs and not with the importTemplateId
   * so the errors will go to the console since universal log service doesn't seem
   * to work in the client
   * @param {Event} e
   * @memberof NewsletterSignUpCtrl
   */
  onSubmit(e) {
    e.preventDefault();

    const currentForm = new FormData(e.target);
    let getUrl = this.apiEndpoint;

    const serialized = qs.stringify({
      postup: {
        address: currentForm.get('email'),
        PostalCode: currentForm.get('zip'),
        Birthday: currentForm.get('birthday')
      }
    });

    getUrl += `?${serialized}`;
    rest.get(getUrl)
      .then((response) => {
        if (response.success) {
          this.view.elements.container.classList.toggle(`${componentName}--success`);
        } else {
          console.log(response);
        }

      })
      .catch(err => console.log(err));

  }
  /**
   *
   * Change handler for input change event
   * @param {Event} e
   * @memberof NewsletterSignUpCtrl
   */
  onInputChange(e) {
    const
      inputEl = e.target,
      validationResults = this.model.getValidationResults(inputEl.name, inputEl.value),
      inputIsValid = this.model.validateInputFromResults(inputEl.name, validationResults);

    if (!validationResults) {
      return;
    }
    this.view.addInvalidMessages(e.target, inputIsValid, validationResults);
    this.view.checkForEmptyInputAndSetClass(inputEl);
    this.view.setSubmitState(this.model.form.isValid());
  }
  /**
   *
   * SPA dismount event handler
   * @memberof NewsletterSignUpCtrl
   */
  onDismount() {
    document.removeEventListener(`${componentName}-mount`, this.onMount);
    document.removeEventListener(`${componentName}-dismount`, this.onDismount);
    this.listeners.forEach(listenerConfig => {
      this.removeEventListener(listenerConfig);
    });
  }
}

/**
 *
 * Clay component export cb
 * @param {HTMLElement} el
 * @returns {HTMLElement}
 */
module.exports = (el) => {
  $ = el.querySelector.bind(el);
  return new NewsletterSignUpCtrl(el);
};
